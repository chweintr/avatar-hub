"""
Vector Store Service for managing embeddings and similarity search
Supports ChromaDB (local) with easy extension to Pinecone, Weaviate
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import hashlib

import chromadb
from chromadb.config import Settings as ChromaSettings
from chromadb.utils import embedding_functions
import numpy as np
from tenacity import retry, stop_after_attempt, wait_exponential

from models.schemas import GrantEntry, ProcessedChunk
from utils.config import settings
from utils.text_processor import TextProcessor

logger = logging.getLogger(__name__)

class VectorStoreService:
    """Service for managing vector storage and retrieval"""
    
    def __init__(self):
        self.client = None
        self.collection = None
        self.embedding_function = None
        self.text_processor = TextProcessor()
        
    async def initialize(self):
        """Initialize the vector store"""
        logger.info(f"Initializing vector store with type: {settings.VECTOR_DB_TYPE}")
        
        if settings.VECTOR_DB_TYPE == "chroma":
            await self._init_chroma()
        elif settings.VECTOR_DB_TYPE == "pinecone":
            await self._init_pinecone()
        elif settings.VECTOR_DB_TYPE == "weaviate":
            await self._init_weaviate()
        else:
            raise ValueError(f"Unsupported vector store type: {settings.VECTOR_DB_TYPE}")
    
    async def _init_chroma(self):
        """Initialize ChromaDB"""
        try:
            # Create persist directory if it doesn't exist
            os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
            
            # Initialize ChromaDB client
            self.client = chromadb.PersistentClient(
                path=settings.CHROMA_PERSIST_DIR,
                settings=ChromaSettings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            # Set up embedding function
            self.embedding_function = embedding_functions.OpenAIEmbeddingFunction(
                api_key=settings.OPENAI_API_KEY,
                model_name=settings.EMBEDDING_MODEL
            )
            
            # Get or create collection
            self.collection = self.client.get_or_create_collection(
                name="art_grants_residencies",
                embedding_function=self.embedding_function,
                metadata={"description": "Art grants and residencies knowledge base"}
            )
            
            logger.info(f"ChromaDB initialized with {self.collection.count()} documents")
            
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {e}")
            raise
    
    async def _init_pinecone(self):
        """Initialize Pinecone (placeholder for future implementation)"""
        raise NotImplementedError("Pinecone integration coming soon")
    
    async def _init_weaviate(self):
        """Initialize Weaviate (placeholder for future implementation)"""
        raise NotImplementedError("Weaviate integration coming soon")
    
    async def ingest_data(self):
        """Ingest data from default knowledge base path"""
        return await self.ingest_json_data(settings.KNOWLEDGE_BASE_PATH, force_update=False)
    
    async def ingest_json_data(self, file_path: str, force_update: bool = False):
        """
        Ingest JSON data from file into vector store
        
        Args:
            file_path: Path to JSON file containing grant/residency data
            force_update: Whether to update existing entries
        """
        logger.info(f"Starting ingestion from {file_path}")

        try:
            # Load JSON data
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            logger.info(f"Loaded JSON with keys: {data.keys() if isinstance(data, dict) else 'list'}")

            # Process entries
            entries_processed = 0
            entries_added = 0
            entries_updated = 0
            errors = []

            # Handle different JSON structures
            if isinstance(data, list):
                entries = data
                logger.info(f"Found {len(entries)} entries in list format")
            elif 'knowledge_base' in data:
                entries = data['knowledge_base'].get('entries', [])
                logger.info(f"Found {len(entries)} entries in knowledge_base.entries format")
            else:
                entries = data.get('entries', [])
                logger.info(f"Found {len(entries)} entries in entries format")
            
            for entry_data in entries:
                try:
                    # Parse entry into GrantEntry model
                    entry = GrantEntry(**entry_data)
                    
                    # Process the entry
                    result = await self._process_entry(entry, force_update)
                    
                    entries_processed += 1
                    if result == "added":
                        entries_added += 1
                    elif result == "updated":
                        entries_updated += 1
                        
                except Exception as e:
                    error_msg = f"Error processing entry {entry_data.get('id', 'unknown')}: {e}"
                    logger.error(error_msg)
                    errors.append(error_msg)
            
            logger.info(
                f"Ingestion complete: {entries_processed} processed, "
                f"{entries_added} added, {entries_updated} updated, {len(errors)} errors"
            )
            
            return {
                "entries_processed": entries_processed,
                "entries_added": entries_added,
                "entries_updated": entries_updated,
                "errors": errors
            }
            
        except Exception as e:
            logger.error(f"Failed to ingest data: {e}")
            raise
    
    async def _process_entry(self, entry: GrantEntry, force_update: bool) -> str:
        """Process a single grant/residency entry"""
        # Generate unique ID for the entry
        entry_id = self._generate_entry_id(entry)
        
        # Check if entry exists
        existing = self.collection.get(ids=[entry_id])
        
        if existing['ids'] and not force_update:
            return "exists"
        
        # Create comprehensive text for embedding
        full_text = self._create_entry_text(entry)
        
        # Create chunks
        chunks = self.text_processor.create_chunks(
            full_text,
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )
        
        # Process each chunk
        chunk_ids = []
        chunk_texts = []
        chunk_metadatas = []
        
        for i, chunk_text in enumerate(chunks):
            chunk_id = f"{entry_id}_chunk_{i}"
            chunk_ids.append(chunk_id)
            chunk_texts.append(chunk_text)
            
            # Create metadata
            metadata = {
                "source_id": entry_id,
                "chunk_index": i,
                "entry_name": entry.name,
                "organization": entry.organization,
                "type": entry.type,
                "disciplines": ",".join(entry.disciplines) if entry.disciplines else "",
                "location": entry.location or "",
                "deadline": entry.deadline or "",
                "website": entry.website or "",
                "last_updated": datetime.utcnow().isoformat()
            }
            chunk_metadatas.append(metadata)
        
        # Add or update in vector store
        if chunk_ids:
            self.collection.upsert(
                ids=chunk_ids,
                documents=chunk_texts,
                metadatas=chunk_metadatas
            )
        
        return "updated" if existing['ids'] else "added"
    
    def _generate_entry_id(self, entry: GrantEntry) -> str:
        """Generate a unique ID for an entry"""
        # Use name and organization for unique ID
        unique_string = f"{entry.name}_{entry.organization}"
        return hashlib.md5(unique_string.encode()).hexdigest()
    
    def _create_entry_text(self, entry: GrantEntry) -> str:
        """Create comprehensive text representation of an entry"""
        sections = []
        
        # Title section
        sections.append(f"# {entry.name}")
        sections.append(f"**Organization:** {entry.organization}")
        sections.append(f"**Type:** {entry.type}")
        
        # Basic information
        if entry.disciplines:
            sections.append(f"**Disciplines:** {', '.join(entry.disciplines)}")
        if entry.location:
            sections.append(f"**Location:** {entry.location}")
        if entry.deadline:
            sections.append(f"**Deadline:** {entry.deadline}")
        if entry.duration:
            sections.append(f"**Duration:** {entry.duration}")
        if entry.funding_amount:
            sections.append(f"**Funding:** {entry.funding_amount}")
        
        # Description
        if entry.description:
            sections.append(f"\n## Description\n{entry.description}")
        
        # Eligibility
        if entry.eligibility:
            sections.append(f"\n## Eligibility\n{entry.eligibility}")
        
        # Application requirements
        if entry.application_requirements:
            sections.append(f"\n## Application Requirements\n{entry.application_requirements}")
        
        # Benefits
        if entry.benefits:
            sections.append(f"\n## Benefits\n- " + "\n- ".join(entry.benefits))
        
        # Selection criteria
        if entry.selection_criteria:
            sections.append(f"\n## Selection Criteria\n{entry.selection_criteria}")
        
        # Tips
        if entry.tips:
            sections.append(f"\n## Application Tips\n{entry.tips}")
        
        # Contact and website
        if entry.website:
            sections.append(f"\n**Website:** {entry.website}")
        if entry.contact:
            sections.append(f"**Contact:** {entry.contact}")
        
        return "\n".join(sections)
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def search(
        self, 
        query: str, 
        num_results: int = 5,
        filter_criteria: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for similar documents in the vector store
        
        Args:
            query: Search query
            num_results: Number of results to return
            filter_criteria: Optional metadata filters
            
        Returns:
            List of search results with text, metadata, and scores
        """
        try:
            # Prepare filter
            where_clause = None
            if filter_criteria:
                where_clause = filter_criteria
            
            # Perform search
            results = self.collection.query(
                query_texts=[query],
                n_results=num_results,
                where=where_clause
            )
            
            # Format results
            formatted_results = []
            if results['ids'] and results['ids'][0]:
                for i in range(len(results['ids'][0])):
                    formatted_results.append({
                        'id': results['ids'][0][i],
                        'text': results['documents'][0][i],
                        'metadata': results['metadatas'][0][i],
                        'score': 1 - results['distances'][0][i]  # Convert distance to similarity
                    })
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Search error: {e}")
            raise
    
    async def get_collection_info(self) -> Dict[str, Any]:
        """Get information about the vector store collection"""
        try:
            count = self.collection.count()
            
            # Get sample of unique entries
            sample = self.collection.get(limit=10)
            unique_sources = set()
            
            if sample['metadatas']:
                for metadata in sample['metadatas']:
                    if metadata.get('entry_name'):
                        unique_sources.add(metadata['entry_name'])
            
            return {
                "total_chunks": count,
                "sample_entries": list(unique_sources)[:5],
                "collection_name": self.collection.name,
                "vector_db_type": settings.VECTOR_DB_TYPE
            }
            
        except Exception as e:
            logger.error(f"Error getting collection info: {e}")
            raise
    
    async def cleanup(self):
        """Cleanup vector store resources"""
        logger.info("Cleaning up vector store resources")
        # ChromaDB persists automatically, but we can add cleanup logic here if needed