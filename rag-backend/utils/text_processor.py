"""
Text processing utilities for chunking and preparing text for embeddings
"""

import re
from typing import List, Optional
import tiktoken

class TextProcessor:
    """Utility class for text processing operations"""
    
    def __init__(self, model_name: str = "gpt-4"):
        """Initialize text processor with tokenizer"""
        self.tokenizer = tiktoken.encoding_for_model(model_name)
        
    def create_chunks(
        self,
        text: str,
        chunk_size: int = 1000,
        chunk_overlap: int = 200
    ) -> List[str]:
        """
        Create overlapping chunks from text
        
        Args:
            text: Input text to chunk
            chunk_size: Target size of each chunk in tokens
            chunk_overlap: Number of tokens to overlap between chunks
            
        Returns:
            List of text chunks
        """
        # Clean the text
        text = self._clean_text(text)
        
        # Split into sentences
        sentences = self._split_into_sentences(text)
        
        # Create chunks
        chunks = []
        current_chunk = []
        current_tokens = 0
        
        for sentence in sentences:
            sentence_tokens = len(self.tokenizer.encode(sentence))
            
            # If adding this sentence would exceed chunk size
            if current_tokens + sentence_tokens > chunk_size and current_chunk:
                # Save current chunk
                chunk_text = " ".join(current_chunk)
                chunks.append(chunk_text)
                
                # Start new chunk with overlap
                if chunk_overlap > 0:
                    # Calculate how many sentences to keep for overlap
                    overlap_tokens = 0
                    overlap_sentences = []
                    
                    for sent in reversed(current_chunk):
                        sent_tokens = len(self.tokenizer.encode(sent))
                        if overlap_tokens + sent_tokens <= chunk_overlap:
                            overlap_sentences.insert(0, sent)
                            overlap_tokens += sent_tokens
                        else:
                            break
                    
                    current_chunk = overlap_sentences
                    current_tokens = overlap_tokens
                else:
                    current_chunk = []
                    current_tokens = 0
            
            # Add sentence to current chunk
            current_chunk.append(sentence)
            current_tokens += sentence_tokens
        
        # Add final chunk
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        return chunks
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters that might interfere with embeddings
        text = re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f-\x9f]', '', text)
        
        # Normalize quotes
        text = text.replace('"', '"').replace('"', '"')
        text = text.replace(''', "'").replace(''', "'")
        
        return text.strip()
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences"""
        # Simple sentence splitting (can be improved with spaCy or NLTK)
        sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)
        
        # Filter out empty sentences
        sentences = [s.strip() for s in sentences if s.strip()]
        
        # Handle bullet points and list items
        final_sentences = []
        for sentence in sentences:
            # Split on newlines that might indicate list items
            parts = sentence.split('\n')
            for part in parts:
                part = part.strip()
                if part:
                    # Add period if missing at the end
                    if part and not part[-1] in '.!?':
                        part += '.'
                    final_sentences.append(part)
        
        return final_sentences
    
    def count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        return len(self.tokenizer.encode(text))
    
    def truncate_text(self, text: str, max_tokens: int) -> str:
        """Truncate text to maximum number of tokens"""
        tokens = self.tokenizer.encode(text)
        if len(tokens) <= max_tokens:
            return text
        
        truncated_tokens = tokens[:max_tokens]
        return self.tokenizer.decode(truncated_tokens)
    
    def format_context(self, chunks: List[str], separator: str = "\n\n---\n\n") -> str:
        """Format multiple chunks into a single context string"""
        return separator.join(chunks)
    
    def extract_keywords(self, text: str) -> List[str]:
        """Extract potential keywords from text (simple implementation)"""
        # Remove common words and extract potential keywords
        common_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'up', 'down', 'out', 'over', 'under',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
            'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
        }
        
        # Simple keyword extraction
        words = re.findall(r'\b[a-z]+\b', text.lower())
        keywords = [w for w in words if w not in common_words and len(w) > 3]
        
        # Count frequency
        word_freq = {}
        for word in keywords:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        # Sort by frequency and return top keywords
        sorted_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, _ in sorted_keywords[:10]]