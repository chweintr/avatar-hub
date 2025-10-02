"""
Retrieval Service for semantic search and context building
"""

import logging
import time
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime

from services.vector_store import VectorStoreService
from utils.config import settings
from utils.text_processor import TextProcessor

logger = logging.getLogger(__name__)

class RetrievalService:
    """Service for retrieving relevant context from the knowledge base"""
    
    def __init__(self, vector_store: VectorStoreService):
        self.vector_store = vector_store
        self.text_processor = TextProcessor()
        
    async def retrieve_context(
        self,
        query: str,
        num_results: int = 5,
        filter_criteria: Optional[Dict[str, Any]] = None,
        rerank: bool = True
    ) -> str:
        """
        Retrieve relevant context for a query
        
        Args:
            query: User's query
            num_results: Number of chunks to retrieve
            filter_criteria: Optional filters (e.g., type, discipline, location)
            rerank: Whether to rerank results
            
        Returns:
            Formatted context string
        """
        start_time = time.time()
        
        try:
            # Enhance query for better retrieval
            enhanced_query = self._enhance_query(query)
            
            # Search vector store
            search_results = await self.vector_store.search(
                enhanced_query,
                num_results=num_results * 2 if rerank else num_results,
                filter_criteria=filter_criteria
            )
            
            if not search_results:
                logger.warning(f"No results found for query: {query}")
                return "No relevant information found in the knowledge base."
            
            # Rerank results if requested
            if rerank and len(search_results) > num_results:
                search_results = self._rerank_results(query, search_results)[:num_results]
            
            # Remove duplicates while preserving order
            unique_results = self._deduplicate_results(search_results)
            
            # Format context
            context = self._format_search_results(unique_results)
            
            retrieval_time = (time.time() - start_time) * 1000
            logger.info(f"Retrieved {len(unique_results)} chunks in {retrieval_time:.2f}ms")
            
            return context
            
        except Exception as e:
            logger.error(f"Retrieval error: {e}")
            raise
    
    def _enhance_query(self, query: str) -> str:
        """Enhance query for better retrieval"""
        # Extract keywords
        keywords = self.text_processor.extract_keywords(query)
        
        # Add contextual terms for art grants domain
        domain_terms = []
        
        # Check for specific patterns and add relevant terms
        query_lower = query.lower()
        
        if any(term in query_lower for term in ['digital', 'new media', 'technology']):
            domain_terms.extend(['digital art', 'new media', 'technology-based'])
            
        if any(term in query_lower for term in ['europe', 'european', 'eu']):
            domain_terms.extend(['European', 'EU', 'Europe-based'])
            
        if any(term in query_lower for term in ['residency', 'residence']):
            domain_terms.extend(['artist residency', 'residential program'])
            
        if any(term in query_lower for term in ['grant', 'funding', 'fellowship']):
            domain_terms.extend(['grant', 'funding', 'financial support'])
            
        if any(term in query_lower for term in ['emerging', 'early career', 'young']):
            domain_terms.extend(['emerging artist', 'early career', 'young artist'])
            
        # Combine original query with enhancements
        enhanced_parts = [query]
        if keywords:
            enhanced_parts.append(' '.join(keywords[:5]))
        if domain_terms:
            enhanced_parts.append(' '.join(domain_terms))
            
        return ' '.join(enhanced_parts)
    
    def _rerank_results(
        self, 
        query: str, 
        results: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Rerank results based on additional criteria
        
        Simple reranking based on:
        - Score from vector search
        - Presence of query terms
        - Metadata relevance (deadlines, locations mentioned in query)
        """
        query_lower = query.lower()
        query_words = set(query_lower.split())
        
        scored_results = []
        
        for result in results:
            # Start with vector similarity score
            score = result.get('score', 0)
            
            # Boost for exact query terms
            text_lower = result['text'].lower()
            term_matches = sum(1 for word in query_words if word in text_lower)
            score += term_matches * 0.1
            
            # Boost for metadata matches
            metadata = result.get('metadata', {})
            
            # Check deadline relevance
            if 'deadline' in query_lower and metadata.get('deadline'):
                score += 0.15
                
            # Check location relevance
            if metadata.get('location'):
                location_lower = metadata['location'].lower()
                if any(word in location_lower for word in query_words):
                    score += 0.2
                    
            # Check discipline relevance
            if metadata.get('disciplines'):
                disciplines_lower = metadata['disciplines'].lower()
                if any(word in disciplines_lower for word in query_words):
                    score += 0.15
            
            scored_results.append({**result, 'rerank_score': score})
        
        # Sort by reranked score
        scored_results.sort(key=lambda x: x['rerank_score'], reverse=True)
        
        return scored_results
    
    def _deduplicate_results(self, results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate or highly similar results"""
        unique_results = []
        seen_sources = set()
        seen_texts = set()
        
        for result in results:
            # Check if we've seen this source and chunk
            source_id = result.get('metadata', {}).get('source_id', '')
            chunk_index = result.get('metadata', {}).get('chunk_index', -1)
            source_chunk_key = f"{source_id}_{chunk_index}"
            
            # Create text fingerprint (first 100 chars)
            text_fingerprint = result['text'][:100].lower().strip()
            
            # Add if unique
            if source_chunk_key not in seen_sources or text_fingerprint not in seen_texts:
                unique_results.append(result)
                seen_sources.add(source_chunk_key)
                seen_texts.add(text_fingerprint)
                
                # Limit consecutive chunks from same source
                if len(unique_results) >= 2:
                    prev_source = unique_results[-2].get('metadata', {}).get('source_id')
                    curr_source = result.get('metadata', {}).get('source_id')
                    if prev_source == curr_source:
                        # Skip if we already have 2 consecutive chunks from same source
                        consecutive_count = sum(
                            1 for r in unique_results[-3:]
                            if r.get('metadata', {}).get('source_id') == curr_source
                        )
                        if consecutive_count >= 2:
                            unique_results.pop()
        
        return unique_results
    
    def _format_search_results(self, results: List[Dict[str, Any]]) -> str:
        """Format search results into a coherent context string"""
        if not results:
            return "No relevant information found."
        
        formatted_chunks = []
        
        for i, result in enumerate(results):
            metadata = result.get('metadata', {})
            
            # Create chunk header
            header_parts = []
            if metadata.get('entry_name'):
                header_parts.append(f"**{metadata['entry_name']}**")
            if metadata.get('organization'):
                header_parts.append(f"by {metadata['organization']}")
                
            header = " ".join(header_parts) if header_parts else f"**Source {i+1}**"
            
            # Add metadata context if relevant
            meta_info = []
            if metadata.get('type'):
                meta_info.append(f"Type: {metadata['type']}")
            if metadata.get('location'):
                meta_info.append(f"Location: {metadata['location']}")
            if metadata.get('deadline'):
                meta_info.append(f"Deadline: {metadata['deadline']}")
                
            # Format chunk
            chunk_parts = [header]
            if meta_info:
                chunk_parts.append(f"[{', '.join(meta_info)}]")
            chunk_parts.append(result['text'])
            
            formatted_chunks.append('\n'.join(chunk_parts))
        
        # Join chunks with separator
        return "\n\n---\n\n".join(formatted_chunks)
    
    async def get_filtered_results(
        self,
        query: str,
        filters: Dict[str, Any]
    ) -> str:
        """
        Retrieve results with specific filters applied
        
        Example filters:
        - type: "residency" or "grant"
        - location: "Europe" or "USA"
        - disciplines: "digital art" or "painting"
        """
        # Build filter criteria for vector store
        filter_criteria = {}
        
        if filters.get('type'):
            filter_criteria['type'] = {"$eq": filters['type']}
            
        if filters.get('location'):
            filter_criteria['location'] = {"$contains": filters['location']}
            
        if filters.get('disciplines'):
            filter_criteria['disciplines'] = {"$contains": filters['disciplines']}
            
        # Retrieve with filters
        return await self.retrieve_context(
            query,
            filter_criteria=filter_criteria
        )
    
    async def get_by_deadline(self, months_ahead: int = 3) -> str:
        """Retrieve grants/residencies with upcoming deadlines"""
        # This would require date parsing and comparison
        # For now, return a search for deadline mentions
        deadline_query = f"deadline application due date within {months_ahead} months upcoming"
        return await self.retrieve_context(deadline_query, num_results=10)