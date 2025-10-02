"""
Pydantic models for request/response validation
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# Request Models
class QueryRequest(BaseModel):
    query: str = Field(..., description="User's query about art grants/residencies")
    num_results: Optional[int] = Field(5, description="Number of context chunks to retrieve")
    stream: Optional[bool] = Field(False, description="Whether to stream the response")
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")
    
    class Config:
        json_schema_extra = {
            "example": {
                "query": "What residencies are available for digital artists in Europe?",
                "num_results": 5,
                "stream": False
            }
        }

class IngestRequest(BaseModel):
    file_path: Optional[str] = Field(None, description="Path to JSON file to ingest")
    data: Optional[Dict[str, Any]] = Field(None, description="Direct JSON data to ingest")
    force_update: bool = Field(False, description="Force update existing entries")
    
    class Config:
        json_schema_extra = {
            "example": {
                "file_path": "/data/art_grants_residencies_kb.json",
                "force_update": False
            }
        }

# Response Models
class ContextChunk(BaseModel):
    text: str
    score: float
    metadata: Dict[str, Any]
    chunk_id: str

class ContextResponse(BaseModel):
    query: str
    context: str
    chunks: Optional[List[ContextChunk]] = None
    num_chunks: int
    retrieval_time_ms: Optional[float] = None

class QueryResponse(BaseModel):
    query: str
    response: str
    context_used: Optional[str] = None
    confidence: float = Field(..., ge=0.0, le=1.0)
    sources: Optional[List[str]] = None
    processing_time_ms: Optional[float] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "query": "What residencies are available for digital artists in Europe?",
                "response": "Based on my knowledge, there are several excellent residencies for digital artists in Europe...",
                "confidence": 0.92,
                "sources": ["European Digital Arts Network", "Ars Electronica"]
            }
        }

class IngestResponse(BaseModel):
    status: str
    message: str
    entries_processed: Optional[int] = None
    entries_added: Optional[int] = None
    entries_updated: Optional[int] = None
    errors: Optional[List[str]] = None

# Internal Models
class GrantEntry(BaseModel):
    """Model for a single grant/residency entry"""
    id: str
    name: str
    organization: str
    description: str
    type: str  # grant, residency, fellowship, etc.
    disciplines: List[str]
    location: Optional[str] = None
    deadline: Optional[str] = None
    duration: Optional[str] = None
    funding_amount: Optional[str] = None
    eligibility: Optional[str] = None
    application_requirements: Optional[str] = None
    website: Optional[str] = None
    contact: Optional[str] = None
    benefits: Optional[List[str]] = None
    selection_criteria: Optional[str] = None
    past_recipients: Optional[List[str]] = None
    tips: Optional[str] = None
    tags: Optional[List[str]] = None
    last_updated: Optional[datetime] = None
    
class ProcessedChunk(BaseModel):
    """Model for processed text chunks"""
    chunk_id: str
    text: str
    embedding: Optional[List[float]] = None
    metadata: Dict[str, Any]
    source_id: str
    chunk_index: int
    
class RAGResponse(BaseModel):
    """Internal model for complete RAG response"""
    query: str
    context: str
    answer: str
    confidence: float
    sources: List[str]
    processing_steps: Dict[str, float]  # timing for each step