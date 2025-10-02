"""
LLM Service for generating responses using GPT-4o
"""

import logging
import time
from typing import Dict, Any, Optional, AsyncGenerator
import json

import openai
from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from utils.config import settings
from models.schemas import RAGResponse

logger = logging.getLogger(__name__)

class LLMService:
    """Service for interacting with OpenAI's GPT-4o"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.LLM_MODEL
        
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def generate_response(
        self,
        query: str,
        context: str,
        stream: bool = False,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> RAGResponse:
        """
        Generate a response using GPT-4o with the retrieved context
        
        Args:
            query: User's original query
            context: Retrieved context from RAG
            stream: Whether to stream the response
            temperature: Override default temperature
            max_tokens: Override default max tokens
            
        Returns:
            RAGResponse with answer and metadata
        """
        start_time = time.time()
        
        # Construct messages
        messages = [
            {"role": "system", "content": settings.SYSTEM_PROMPT},
            {"role": "user", "content": self._construct_user_prompt(query, context)}
        ]
        
        try:
            if stream:
                return await self._generate_streaming_response(
                    messages, query, context, temperature, max_tokens
                )
            else:
                return await self._generate_complete_response(
                    messages, query, context, temperature, max_tokens
                )
                
        except Exception as e:
            logger.error(f"LLM generation error: {e}")
            raise
    
    def _construct_user_prompt(self, query: str, context: str) -> str:
        """Construct the user prompt with query and context"""
        prompt = f"""Based on the following context from the art grants and residencies knowledge base, please answer the user's question. If the context doesn't contain enough information to fully answer the question, acknowledge this and provide any relevant general guidance you can.

CONTEXT:
{context}

USER QUESTION:
{query}

Please provide a helpful, accurate, and well-structured response."""
        
        return prompt
    
    async def _generate_complete_response(
        self,
        messages: list,
        query: str,
        context: str,
        temperature: Optional[float],
        max_tokens: Optional[int]
    ) -> RAGResponse:
        """Generate a complete (non-streaming) response"""
        start_time = time.time()
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature or settings.TEMPERATURE,
            max_tokens=max_tokens or settings.MAX_TOKENS,
            top_p=0.9,
            frequency_penalty=0.1,
            presence_penalty=0.1
        )
        
        # Extract response
        answer = response.choices[0].message.content
        
        # Calculate confidence based on response characteristics
        confidence = self._calculate_confidence(answer, context)
        
        # Extract sources from context
        sources = self._extract_sources(context)
        
        processing_time = (time.time() - start_time) * 1000
        
        return RAGResponse(
            query=query,
            context=context,
            answer=answer,
            confidence=confidence,
            sources=sources,
            processing_steps={
                "llm_generation_ms": processing_time
            }
        )
    
    async def _generate_streaming_response(
        self,
        messages: list,
        query: str,
        context: str,
        temperature: Optional[float],
        max_tokens: Optional[int]
    ) -> AsyncGenerator[str, None]:
        """Generate a streaming response"""
        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature or settings.TEMPERATURE,
            max_tokens=max_tokens or settings.MAX_TOKENS,
            top_p=0.9,
            stream=True
        )
        
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    
    def _calculate_confidence(self, answer: str, context: str) -> float:
        """
        Calculate confidence score based on response characteristics
        
        Factors:
        - Length of answer relative to context
        - Presence of uncertainty phrases
        - Specificity of information
        """
        confidence = 0.8  # Base confidence
        
        # Check for uncertainty phrases
        uncertainty_phrases = [
            "i don't have", "no information", "not found", "unable to find",
            "not mentioned", "unclear", "not specified", "might", "possibly",
            "it seems", "appears to be"
        ]
        
        answer_lower = answer.lower()
        uncertainty_count = sum(1 for phrase in uncertainty_phrases if phrase in answer_lower)
        confidence -= uncertainty_count * 0.1
        
        # Check for specific information (dates, names, numbers)
        import re
        
        # Count specific elements
        dates = len(re.findall(r'\b\d{4}\b|\b\d{1,2}/\d{1,2}\b', answer))
        urls = len(re.findall(r'https?://\S+|www\.\S+', answer))
        amounts = len(re.findall(r'\$[\d,]+|\d+\s*(?:USD|EUR|GBP)', answer))
        
        specific_info_count = dates + urls + amounts
        confidence += min(specific_info_count * 0.05, 0.15)
        
        # Ensure confidence is within bounds
        return max(0.1, min(1.0, confidence))
    
    def _extract_sources(self, context: str) -> list:
        """Extract source names from context"""
        sources = []
        
        # Look for source patterns in context
        lines = context.split('\n')
        for line in lines:
            # Look for bold headers (source names)
            if line.startswith('**') and line.endswith('**'):
                source = line.strip('*').strip()
                if source and source not in sources:
                    sources.append(source)
            # Also look for "by Organization" pattern
            elif ' by ' in line and not line.startswith('['):
                parts = line.split(' by ')
                if len(parts) == 2:
                    sources.append(parts[1].strip())
        
        return sources[:5]  # Limit to 5 sources
    
    async def generate_clarification(self, query: str, context: str) -> str:
        """Generate a clarification question when query is ambiguous"""
        prompt = f"""The user has asked a question about art grants and residencies, but the query needs clarification to provide the most helpful response.

User query: {query}

Available context suggests these possible interpretations or missing information. Generate a friendly clarification question to better understand what the user is looking for.

Keep the clarification brief and offer 2-3 specific options if applicable."""
        
        messages = [
            {"role": "system", "content": "You are a helpful assistant specializing in art grants and residencies."},
            {"role": "user", "content": prompt}
        ]
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.7,
            max_tokens=150
        )
        
        return response.choices[0].message.content
    
    async def format_response_for_speech(self, response: str) -> str:
        """Format response for text-to-speech, removing markdown and adjusting for speech"""
        # Remove markdown formatting
        speech_text = response
        
        # Remove bold
        speech_text = speech_text.replace('**', '')
        
        # Remove links
        import re
        speech_text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', speech_text)
        speech_text = re.sub(r'https?://\S+', 'link in description', speech_text)
        
        # Replace bullet points with pauses
        speech_text = speech_text.replace('\n- ', '\n... ')
        speech_text = speech_text.replace('\n* ', '\n... ')
        
        # Add pauses for better speech flow
        speech_text = speech_text.replace('\n\n', ' ... ')
        
        return speech_text