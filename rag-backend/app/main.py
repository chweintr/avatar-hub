"""
Art Grants & Residency Expert - RAG Backend
Main FastAPI application with WebSocket support for real-time communication
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.vector_store import VectorStoreService
from services.retrieval import RetrievalService
from services.llm_service import LLMService
from services.simli_orchestrator import SimliOrchestrator
from services.scheduler import scheduler
from models.schemas import (
    QueryRequest, 
    QueryResponse, 
    IngestRequest,
    IngestResponse,
    ContextResponse
)
from utils.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize services as globals
vector_store_service: Optional[VectorStoreService] = None
retrieval_service: Optional[RetrievalService] = None
llm_service: Optional[LLMService] = None
simli_orchestrator: Optional[SimliOrchestrator] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup, cleanup on shutdown"""
    global vector_store_service, retrieval_service, llm_service, simli_orchestrator
    
    logger.info("Starting RAG Backend for Art Grants & Residency Expert...")
    
    # Initialize services
    try:
        vector_store_service = VectorStoreService()
        await vector_store_service.initialize()
        
        retrieval_service = RetrievalService(vector_store_service)
        llm_service = LLMService()
        simli_orchestrator = SimliOrchestrator(retrieval_service, llm_service)

        # Auto-ingest data on first startup if database is empty
        if vector_store_service.collection.count() == 0:
            logger.info("Database is empty - auto-ingesting knowledge base...")
            try:
                await vector_store_service.ingest_json_data("./data/art_grants_residencies_kb.json", force_update=True)
                logger.info("✓ Auto-ingestion completed successfully")
            except Exception as ingest_error:
                logger.error(f"Auto-ingestion failed: {ingest_error}")

        # Start the update scheduler
        scheduler.start()

        logger.info("All services initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        raise
    
    yield
    
    # Cleanup
    logger.info("Shutting down RAG Backend...")
    
    # Stop scheduler
    scheduler.stop()
    
    if vector_store_service:
        await vector_store_service.cleanup()

# Create FastAPI app
app = FastAPI(
    title="Art Grants & Residency Expert RAG Backend",
    description="A sophisticated RAG backend for providing expert advice on art grants and residencies",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
cors_origins = settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Check if all services are operational"""
    return {
        "status": "healthy",
        "services": {
            "vector_store": vector_store_service is not None,
            "retrieval": retrieval_service is not None,
            "llm": llm_service is not None,
            "orchestrator": simli_orchestrator is not None
        }
    }

# Data ingestion endpoint
@app.post("/ingest", response_model=IngestResponse)
async def ingest_knowledge_base(
    request: IngestRequest,
    background_tasks: BackgroundTasks
):
    """
    Ingest art grants and residencies data into the vector database
    This can be called initially or to update the knowledge base
    """
    if not vector_store_service:
        raise HTTPException(status_code=503, detail="Vector store service not initialized")
    
    try:
        # Run ingestion in background to avoid timeout
        background_tasks.add_task(
            vector_store_service.ingest_json_data,
            request.file_path or "/data/art_grants_residencies_kb.json",
            request.force_update
        )
        
        return IngestResponse(
            status="started",
            message="Data ingestion started in background"
        )
    except Exception as e:
        logger.error(f"Ingestion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Context retrieval endpoint
@app.post("/retrieve_context", response_model=ContextResponse)
async def retrieve_context(query: QueryRequest) -> ContextResponse:
    """
    Retrieve relevant context for a user query
    Returns the most relevant chunks from the knowledge base
    """
    if not retrieval_service:
        raise HTTPException(status_code=503, detail="Retrieval service not initialized")
    
    try:
        context = await retrieval_service.retrieve_context(
            query.query,
            num_results=query.num_results or 5
        )
        
        return ContextResponse(
            query=query.query,
            context=context,
            num_chunks=len(context.split("\n\n"))
        )
    except Exception as e:
        logger.error(f"Retrieval error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Complete query endpoint (RAG + LLM)
@app.post("/query", response_model=QueryResponse)
async def process_query(query: QueryRequest) -> QueryResponse:
    """
    Process a complete query through the RAG pipeline
    1. Retrieve relevant context
    2. Generate response with GPT-4o
    3. Return the complete response
    """
    if not simli_orchestrator:
        raise HTTPException(status_code=503, detail="Orchestrator not initialized")
    
    try:
        response = await simli_orchestrator.process_query(
            query.query,
            stream=query.stream
        )
        
        return QueryResponse(
            query=query.query,
            response=response.answer,
            context_used=response.context,
            confidence=response.confidence
        )
    except Exception as e:
        logger.error(f"Query processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket endpoint for real-time communication with Simli
@app.websocket("/ws/simli")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time communication with Simli client
    Handles speech-to-text input and returns generated responses
    """
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    if not simli_orchestrator:
        await websocket.close(code=1011, reason="Service not initialized")
        return
    
    try:
        while True:
            # Receive message from Simli client
            data = await websocket.receive_json()
            
            if data.get("type") == "query":
                # Process the query from Simli frontend
                query_text = data.get("text", "") or data.get("content", "")
                logger.info(f"Received query from Simli: {query_text}")
                
                # Send processing status
                await websocket.send_json({
                    "type": "processing",
                    "message": "Searching knowledge base..."
                })
                
                # Get response through RAG pipeline
                response = await simli_orchestrator.process_query(
                    query_text,
                    stream=False  # Don't stream for now
                )
                
                # Send context chunks (optional, for debugging)
                if response.sources:
                    await websocket.send_json({
                        "type": "context",
                        "chunks": [{"source": s, "text": s[:100] + "..."} for s in response.sources[:3]]
                    })
                
                # Send final response for Simli to speak
                await websocket.send_json({
                    "type": "response",
                    "text": response.answer,
                    "confidence": response.confidence
                })
            
            elif data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close(code=1011, reason=str(e))

# Admin endpoint to check vector store status
@app.get("/admin/vector_store_info")
async def vector_store_info():
    """Get information about the vector store"""
    if not vector_store_service:
        raise HTTPException(status_code=503, detail="Vector store service not initialized")
    
    try:
        info = await vector_store_service.get_collection_info()
        return {
            "status": "success",
            "info": info
        }
    except Exception as e:
        logger.error(f"Error getting vector store info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Admin endpoint to trigger manual update
@app.post("/admin/trigger_update")
async def trigger_manual_update(background_tasks: BackgroundTasks):
    """Manually trigger a knowledge base update"""
    try:
        # Run update in background
        background_tasks.add_task(scheduler.trigger_manual_update)
        
        return {
            "status": "started",
            "message": "Manual update triggered in background"
        }
    except Exception as e:
        logger.error(f"Error triggering manual update: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Admin endpoint to get update status
@app.get("/admin/update_status")
async def get_update_status():
    """Get current update scheduler status"""
    try:
        jobs = []
        for job in scheduler.scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
                "trigger": str(job.trigger)
            })
        
        return {
            "scheduler_running": scheduler._running,
            "jobs": jobs,
            "update_schedule": settings.UPDATE_SCHEDULE
        }
    except Exception as e:
        logger.error(f"Error getting update status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=settings.DEBUG
    )