# Unified Avatar Hub Deployment (Caleb's Club)

This guide explains how the Avatar Hub works with multiple avatar types, including the Art Grants Expert with RAG backend.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  React Frontend │────▶│ Express Backend │────▶│  RAG Backend    │
│  (Avatar Hub)   │     │   (API Proxy)   │     │ (Grants Expert) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                          │
                               ▼                          ▼
                        ┌─────────────┐          ┌─────────────┐
                        │ Simli/HeyGen│          │  ChromaDB   │
                        │   Avatars   │          │Vector Store │
                        └─────────────┘          └─────────────┘
```

## Avatar Types

1. **Studio Brainstormer** - Creative ideation (Simli)
2. **Tax Advisor** - Tax help for artists (Simli with agent)
3. **Grant/Residency Expert** - Art grants advisor (Simli + RAG backend)
4. **Crit Partner** - Constructive feedback (Simli)

## Local Development

### 1. Start All Services
```bash
# Using Docker Compose (recommended)
docker-compose up

# Or manually:
# Terminal 1 - RAG Backend
cd rag-backend
pip install -r requirements.txt
uvicorn app.main:app --port 8000

# Terminal 2 - Express Backend
npm install
npm run server

# Terminal 3 - React Frontend
npm run dev
```

### 2. Environment Variables
Create `.env` in root directory:

```env
# Required
OPENAI_API_KEY=sk-your-key
SIMLI_API_KEY=your-simli-key

# Optional
ELEVENLABS_API_KEY=your-elevenlabs-key
RAG_BACKEND_URL=http://localhost:8000
```

### 3. Initialize Art Grants Data
```bash
# First time only - ingest knowledge base
curl -X POST http://localhost:8000/ingest
```

## Railway Deployment (Single Project)

### 1. Project Structure
Your Railway project will have 3 services:

- **frontend** - React app (Avatar Hub UI)
- **backend** - Express server (API proxy)
- **rag-backend** - Python FastAPI (Grants expert)

### 2. Configure Services

#### Frontend Service
- Source: Root directory
- Build Command: `npm run build`
- Start Command: `npm run preview`
- Environment:
  ```
  VITE_API_URL=${{backend.RAILWAY_PUBLIC_DOMAIN}}
  ```

#### Backend Service
- Source: Root directory
- Build Command: `npm install`
- Start Command: `npm run server`
- Environment:
  ```
  SIMLI_API_KEY=your-key
  OPENAI_API_KEY=your-key
  ELEVENLABS_API_KEY=your-key
  RAG_BACKEND_URL=${{rag-backend.RAILWAY_PRIVATE_DOMAIN}}
  ```

#### RAG Backend Service
- Source: `/rag-backend` directory
- Dockerfile Path: `./Dockerfile`
- Environment:
  ```
  OPENAI_API_KEY=your-key
  UPDATE_SCHEDULE=cron:0 0 * * *
  CORS_ORIGINS=${{frontend.RAILWAY_PUBLIC_DOMAIN}}
  ```

### 3. Service Dependencies
In Railway, set service dependencies:
- frontend → depends on → backend
- backend → depends on → rag-backend

## How the Grants Avatar Works

1. **User selects "Grant/Residency Expert"** in Avatar Hub
2. **Frontend requests avatar config** from Express backend
3. **Express returns Simli config** with face ID: `cace3ef7-a4c4-425d-a8cf-a5358eb0c427`
4. **When user asks a question:**
   - Frontend sends query to Express `/api/rag/query`
   - Express proxies to RAG backend
   - RAG backend searches vector database
   - Returns expert response with sources
5. **Avatar speaks the response** via Simli

## Testing the Integration

### Test Grants Avatar Locally
```bash
# 1. Check RAG backend health
curl http://localhost:8000/health

# 2. Test a query
curl -X POST http://localhost:3001/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{"avatarId": "grants", "query": "What residencies are available in Europe?"}'

# 3. Open Avatar Hub
open http://localhost:3000
# Select "Grant/Residency Expert"
```

## Automated Updates

The RAG backend automatically updates its knowledge base:
- Default: Daily at midnight
- Manual trigger: `POST /admin/trigger_update`
- Check status: `GET /admin/update_status`

## Environment Variables Reference

### Express Backend
- `SIMLI_API_KEY` - For avatar rendering
- `OPENAI_API_KEY` - For chat functionality  
- `RAG_BACKEND_URL` - Internal URL to RAG backend

### RAG Backend
- `OPENAI_API_KEY` - For embeddings and GPT-4o
- `UPDATE_SCHEDULE` - Cron expression or interval
- `ENABLE_WEB_SCRAPING` - Enable/disable scrapers

## Troubleshooting

### Grants Avatar Not Working
1. Check RAG backend is running: `http://localhost:8000/health`
2. Verify knowledge base is loaded: `GET /admin/vector_store_info`
3. Check Express backend can reach RAG: Look for proxy errors

### WebSocket Connection Failed
- Ensure CORS is configured correctly
- Check firewall/proxy settings
- Verify WebSocket URL in frontend

### Updates Not Running
- Check scheduler status: `GET /admin/update_status`
- Verify UPDATE_SCHEDULE format
- Check logs for scraping errors