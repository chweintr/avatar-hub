# RAG Backend Deployment Instructions

## Quick Setup

The grants specialist agent requires the RAG backend to be deployed on Railway. Follow these steps:

### 1. Deploy RAG Backend Service

1. In Railway dashboard, create a new service
2. Connect to this GitHub repo
3. Set **Root Directory** to: `rag-backend`
4. Railway will auto-detect the `railway.json` and `Dockerfile`

### 2. Set Environment Variables for RAG Backend

In the RAG backend service settings, add:

```env
OPENAI_API_KEY=<your-openai-key>
PORT=8000
DEBUG=false
CORS_ORIGINS=["*"]
CHROMA_PERSIST_DIR=/app/chroma_db
UPDATE_SCHEDULE=0 2 * * *
```

### 3. Get Internal URL

Once deployed, Railway will provide an internal URL like:
```
http://rag-backend.railway.internal:8000
```

Or use the service name Railway assigns.

### 4. Configure Grants Worker

In your **worker-grants** service environment variables, add:

```env
RAG_BACKEND_URL=http://rag-backend.railway.internal:8000
```

Replace `rag-backend` with your actual service name in Railway.

### 5. Verify Connection

Check the grants worker logs - you should see:
```
Connecting to RAG backend at: http://rag-backend.railway.internal:8000
```

Check the RAG backend health endpoint:
```bash
curl https://your-rag-backend.railway.app/health
```

Should return:
```json
{
  "status": "healthy",
  "services": {
    "vector_store": true,
    "retrieval": true,
    "llm": true,
    "orchestrator": true
  }
}
```

## Troubleshooting

### "Unable to access knowledge base"

1. Check RAG backend service is running (not crashed)
2. Verify `RAG_BACKEND_URL` is set in worker-grants environment
3. Check logs in RAG backend for startup errors
4. Ensure internal networking is enabled (Railway does this by default)

### Database Not Initialized

The RAG backend auto-initializes ChromaDB on startup. Check logs for:
```
All services initialized successfully
```

If you see errors, the knowledge base JSON might be missing or OpenAI API key might be invalid.
