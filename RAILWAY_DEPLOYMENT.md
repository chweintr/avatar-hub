# Railway Deployment Instructions

## Environment Variables for Avatar Hub

### Core API Keys
```
OPENAI_API_KEY=sk-your-openai-key
SIMLI_API_KEY=your-simli-key
ELEVENLABS_API_KEY=your-elevenlabs-key
```

### Multiple Simli Face IDs
Since you have multiple avatars, use numbered face IDs:

```
# Tax Advisor (has Simli agent)
FACE_ID_1=afdb6a3e-3939-40aa-92df-01604c23101c

# Grant/Residency Expert (uses RAG backend, no Simli agent)
FACE_ID_2=cace3ef7-a4c4-425d-a8cf-a5358eb0c427

# Studio Brainstormer
FACE_ID_3=your-brainstormer-face-id

# Crit Partner
FACE_ID_4=your-crit-partner-face-id
```

### Voice IDs (if using ElevenLabs)
```
# Grant Expert Voice
VOICE_ID_GRANTS=OYTbf65OHHFELVut7v2H
```

### Internal Service URLs
```
# RAG Backend URL (internal Railway URL)
RAG_BACKEND_URL=http://rag-backend.railway.internal:8000
```

## Service-Specific Variables

### Frontend Service
```
VITE_API_URL=https://your-backend.railway.app
```

### Backend Service
```
PORT=3001
RAG_BACKEND_URL=http://rag-backend.railway.internal:8000
```

### RAG Backend Service
```
PORT=8000
UPDATE_SCHEDULE=cron:0 0 * * *
CORS_ORIGINS=https://your-frontend.railway.app
```

## Understanding the Architecture

### For Tax Advisor (Using Simli Agent)
```
User → Simli STT → Simli Agent (built-in KB) → Simli TTS → User
```
- Uses FACE_ID_1
- Has a Simli agent with system prompt
- No RAG backend involved

### For Grant Expert (Using RAG Backend)
```
User → Simli STT → Our Express Backend → RAG Backend → GPT-4o → Express → Simli TTS → User
```
- Uses FACE_ID_2
- NO Simli agent
- Intelligence comes from our RAG backend
- Simli is only for visual/audio interface

## Deployment Steps

1. Create Railway project with 3 services:
   - `frontend` (React app)
   - `backend` (Express server)
   - `rag-backend` (Python FastAPI)

2. Set environment variables for each service as listed above

3. Configure service dependencies:
   - frontend depends on backend
   - backend depends on rag-backend

4. Deploy and wait for builds to complete

5. Initialize RAG knowledge base:
   ```bash
   curl -X POST https://your-rag-backend.railway.app/ingest
   ```

## Important Notes

- The Grant Expert does NOT need a Simli agent ID
- Simli is purely the presentation layer for the Grant Expert
- All intelligence for Grant Expert comes from RAG backend + GPT-4o
- The numbered FACE_ID_X pattern allows multiple avatars in one project