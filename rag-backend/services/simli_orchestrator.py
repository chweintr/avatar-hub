"""
Simli Orchestrator for coordinating between Simli, RAG, and LLM services
"""

import logging
import time
from typing import Optional, Dict, Any
import asyncio
import json

from fastapi import WebSocket

from services.retrieval import RetrievalService
from services.llm_service import LLMService
from models.schemas import RAGResponse
from utils.config import settings

logger = logging.getLogger(__name__)

class SimliOrchestrator:
    """Orchestrates the flow between Simli frontend, RAG backend, and LLM"""
    
    def __init__(self, retrieval_service: RetrievalService, llm_service: LLMService):
        self.retrieval_service = retrieval_service
        self.llm_service = llm_service
        self.active_sessions = {}
        
    async def process_query(
        self,
        query: str,
        stream: bool = False,
        websocket: Optional[WebSocket] = None,
        session_id: Optional[str] = None
    ) -> RAGResponse:
        """
        Process a complete query through the RAG pipeline
        
        Args:
            query: User's query
            stream: Whether to stream the response
            websocket: WebSocket connection for real-time updates
            session_id: Session ID for conversation continuity
            
        Returns:
            Complete RAG response
        """
        start_time = time.time()
        processing_steps = {}
        
        try:
            # Step 1: Send status update if websocket
            if websocket:
                await self._send_status(websocket, "Searching knowledge base...")
            
            # Step 2: Retrieve relevant context
            retrieval_start = time.time()
            context = await self.retrieval_service.retrieve_context(query, num_results=5)
            processing_steps["retrieval_ms"] = (time.time() - retrieval_start) * 1000
            
            # Step 3: Send status update
            if websocket:
                await self._send_status(websocket, "Generating response...")
            
            # Step 4: Generate response with LLM
            llm_start = time.time()
            
            if stream and websocket:
                # Stream response through websocket
                answer = await self._stream_response(query, context, websocket)
                processing_steps["llm_generation_ms"] = (time.time() - llm_start) * 1000
                
                # Calculate confidence after streaming
                confidence = self.llm_service._calculate_confidence(answer, context)
                sources = self.llm_service._extract_sources(context)
                
                rag_response = RAGResponse(
                    query=query,
                    context=context,
                    answer=answer,
                    confidence=confidence,
                    sources=sources,
                    processing_steps=processing_steps
                )
            else:
                # Get complete response
                rag_response = await self.llm_service.generate_response(
                    query=query,
                    context=context,
                    stream=False
                )
                processing_steps["llm_generation_ms"] = (time.time() - llm_start) * 1000
                rag_response.processing_steps = processing_steps
            
            # Step 5: Store in session if session_id provided
            if session_id:
                await self._update_session(session_id, query, rag_response)
            
            # Step 6: Calculate total time
            total_time = (time.time() - start_time) * 1000
            processing_steps["total_ms"] = total_time
            
            logger.info(
                f"Query processed in {total_time:.2f}ms "
                f"(retrieval: {processing_steps['retrieval_ms']:.2f}ms, "
                f"generation: {processing_steps.get('llm_generation_ms', 0):.2f}ms)"
            )
            
            return rag_response
            
        except Exception as e:
            logger.error(f"Orchestration error: {e}")
            raise
    
    async def _stream_response(
        self,
        query: str,
        context: str,
        websocket: WebSocket
    ) -> str:
        """Stream LLM response through websocket"""
        full_response = []
        
        try:
            # Start streaming
            await websocket.send_json({
                "type": "stream_start",
                "message": "Starting response stream..."
            })
            
            # Stream the response
            async for chunk in self.llm_service._generate_streaming_response(
                messages=[
                    {"role": "system", "content": settings.SYSTEM_PROMPT},
                    {"role": "user", "content": self.llm_service._construct_user_prompt(query, context)}
                ],
                query=query,
                context=context,
                temperature=None,
                max_tokens=None
            ):
                full_response.append(chunk)
                
                # Send chunk through websocket
                await websocket.send_json({
                    "type": "stream_chunk",
                    "content": chunk
                })
                
                # Small delay to prevent overwhelming the client
                await asyncio.sleep(0.01)
            
            # Send stream complete
            await websocket.send_json({
                "type": "stream_complete",
                "message": "Response complete"
            })
            
            return ''.join(full_response)
            
        except Exception as e:
            logger.error(f"Streaming error: {e}")
            await websocket.send_json({
                "type": "stream_error",
                "error": str(e)
            })
            raise
    
    async def _send_status(self, websocket: WebSocket, message: str):
        """Send status update through websocket"""
        try:
            await websocket.send_json({
                "type": "status",
                "message": message
            })
        except Exception as e:
            logger.warning(f"Failed to send status: {e}")
    
    async def _update_session(self, session_id: str, query: str, response: RAGResponse):
        """Update session history"""
        if session_id not in self.active_sessions:
            self.active_sessions[session_id] = {
                "created_at": time.time(),
                "history": []
            }
        
        self.active_sessions[session_id]["history"].append({
            "timestamp": time.time(),
            "query": query,
            "response": response.answer,
            "confidence": response.confidence,
            "sources": response.sources
        })
        
        # Limit session history
        if len(self.active_sessions[session_id]["history"]) > 10:
            self.active_sessions[session_id]["history"] = \
                self.active_sessions[session_id]["history"][-10:]
    
    async def handle_voice_query(
        self,
        audio_data: bytes,
        websocket: WebSocket,
        session_id: str
    ) -> Dict[str, Any]:
        """
        Handle voice input from Simli
        
        This is a placeholder for voice handling.
        In production, you would:
        1. Send audio to speech-to-text service
        2. Process the transcribed text
        3. Generate response
        4. Convert to speech with ElevenLabs
        5. Send back to Simli
        """
        # Placeholder implementation
        logger.info("Voice query received (not implemented)")
        
        await websocket.send_json({
            "type": "error",
            "message": "Voice processing not yet implemented. Please use text input."
        })
        
        return {"status": "not_implemented"}
    
    async def get_session_history(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get conversation history for a session"""
        return self.active_sessions.get(session_id)
    
    async def clear_session(self, session_id: str):
        """Clear a session's history"""
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
    
    async def prepare_for_tts(self, response: str) -> str:
        """Prepare response text for text-to-speech"""
        return await self.llm_service.format_response_for_speech(response)