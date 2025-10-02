#!/bin/bash

# Start all services for Avatar Hub (Caleb's Club)

echo "🚀 Starting Avatar Hub with all services..."

# Check if running on Railway
if [ -n "$RAILWAY_ENVIRONMENT" ]; then
    echo "Running on Railway - starting production mode"
    
    # Start RAG backend in background
    cd rag-backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 &
    RAG_PID=$!
    
    # Wait for RAG backend to be ready
    echo "Waiting for RAG backend..."
    sleep 10
    
    # Ingest data if it's the first run
    if [ ! -f "/app/chroma_db/.initialized" ]; then
        echo "First run - ingesting knowledge base..."
        curl -X POST http://localhost:8000/ingest
        touch /app/chroma_db/.initialized
    fi
    
    # Start Express server
    cd .. && npm run server
    
else
    echo "Running locally - starting development mode"
    
    # Start RAG backend
    echo "Starting RAG backend..."
    cd rag-backend
    source venv/bin/activate 2>/dev/null || python -m venv venv && source venv/bin/activate
    pip install -q -r requirements.txt
    uvicorn app.main:app --reload --port 8000 &
    RAG_PID=$!
    
    # Start Express backend
    echo "Starting Express backend..."
    cd ..
    npm install
    npm run server &
    EXPRESS_PID=$!
    
    # Start React frontend
    echo "Starting React frontend..."
    npm run dev &
    REACT_PID=$!
    
    # Wait for services
    sleep 5
    
    echo "✅ All services started!"
    echo ""
    echo "Services running at:"
    echo "  Frontend: http://localhost:5173"
    echo "  Express API: http://localhost:3001"
    echo "  RAG Backend: http://localhost:8000"
    echo ""
    echo "To ingest art grants data (first time only):"
    echo "  curl -X POST http://localhost:8000/ingest"
    echo ""
    echo "Press Ctrl+C to stop all services"
    
    # Wait for interrupt
    trap "kill $RAG_PID $EXPRESS_PID $REACT_PID 2>/dev/null" EXIT
    wait
fi