# Railway Environment Variables - Quick Reference

## Service 1: worker-tax
**Root Directory:** `services/worker-tax`

```bash
# LiveKit
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxx

# Simli
SIMLI_API_KEY=your_simli_api_key
SIMLI_FACE_ID=afdb6a3e-3939-40aa-92df-01604c23101c

# AI
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
ELEVEN_API_KEY=sk_xxxxxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=NaKPQmdr7mMxXuXrNeFC
```

## Service 2: worker-grants
**Root Directory:** `services/worker-grants`

```bash
# LiveKit (same as above)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxx

# Simli (different face)
SIMLI_API_KEY=your_simli_api_key
SIMLI_FACE_ID=cace3ef7-a4c4-425d-a8cf-a5358eb0c427

# AI
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
ELEVEN_API_KEY=sk_xxxxxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=OYTbf65OHHFELVut7v2H

# RAG Backend (IMPORTANT)
RAG_BACKEND_URL=http://rag-backend.railway.internal:8000
```

**Note:** Replace `rag-backend` with your actual Railway service name.

## Service 3: rag-backend
**Root Directory:** `rag-backend`
**Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

```bash
# Required
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx

# Database
VECTOR_DB_TYPE=chroma
CHROMA_PERSIST_DIR=/app/chroma_db
KNOWLEDGE_BASE_PATH=/app/data/art_grants_residencies_kb.json

# RAG Settings
EMBEDDING_MODEL=text-embedding-ada-002
LLM_MODEL=gpt-4o
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
NUM_RESULTS=5

# Auto-Update (Choose one schedule format)
UPDATE_SCHEDULE=cron:0 0 * * *
# OR
UPDATE_SCHEDULE=interval:24h

UPDATE_ON_STARTUP=false
ENABLE_WEB_SCRAPING=true
SCRAPING_TIMEOUT=30

# Optional - Notifications
NOTIFICATION_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK

# Optional - Custom Sources (JSON array, minified)
CUSTOM_DATA_SOURCES=[]

# App Settings
DEBUG=false
PORT=8000
```

## After Deployment

1. **Trigger initial data ingestion:**
   ```bash
   curl -X POST https://your-rag-backend.railway.app/ingest
   ```

2. **Verify it worked:**
   ```bash
   curl https://your-rag-backend.railway.app/admin/vector_store_info
   ```

3. **Test a query:**
   ```bash
   curl -X POST https://your-rag-backend.railway.app/query \
     -H "Content-Type: application/json" \
     -d '{"query": "art residencies in Berlin"}'
   ```

## Common Issues

### Tax agent still using OpenAI voice?
- Check: `ELEVEN_API_KEY` is set (not `ELEVENLABS_API_KEY`)
- Redeploy after adding the key

### Grant agent says "trouble accessing knowledge base"?
- Check: `RAG_BACKEND_URL` format is correct
- Use: `http://[service-name].railway.internal:8000`
- Verify rag-backend service is running

### No automatic updates happening?
- View logs in Railway rag-backend service
- Check: `/admin/update_status` endpoint
- Try manual: `/admin/trigger_update`
