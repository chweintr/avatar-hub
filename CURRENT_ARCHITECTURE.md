# Avatar Hub - Current Architecture (LiveKit + Simli)

**Last Updated:** October 9, 2025

## Overview

Avatar Hub uses **LiveKit agents** deployed on Railway. Each agent is a separate Python worker service that handles voice conversation using OpenAI Realtime API and Simli for avatars.

## Architecture

```
User Browser
    ↓ (connects via LiveKit WebSocket)
Railway: worker-tax (Python LiveKit agent)
    ├─ OpenAI Realtime API (STT + LLM + TTS)
    └─ Simli Avatar (face + lip sync)

Railway: worker-grants (Python LiveKit agent)
    ├─ OpenAI STT + LLM
    ├─ Simli Avatar
    └─ RAG Backend (cooperative-hope) for grants database
```

## Railway Services

### 1. avatar-hub-production
- **What it is:** Frontend (React/Vite) + Express backend
- **URL:** https://avatar-hub-production.up.railway.app/
- **Build:** Runs `npm run build` then `npm start`
- **Env vars needed:**
  - `LIVEKIT_URL` - Your LiveKit cloud WebSocket URL
  - `LIVEKIT_API_KEY` - LiveKit API key
  - `LIVEKIT_API_SECRET` - LiveKit API secret
  - `PORT` - Automatically set by Railway

### 2. worker-tax
- **What it is:** Tax advisor agent (Indian woman avatar, nova voice)
- **Root Directory:** `services/worker-tax`
- **Start Command:** `python main.py start`
- **Env vars needed:**
  ```
  LIVEKIT_URL=wss://your-project.livekit.cloud
  LIVEKIT_API_KEY=APIxxxxxxxxx
  LIVEKIT_API_SECRET=xxxxxxxxxxxxxx
  SIMLI_API_KEY=your_simli_key
  SIMLI_TAX_FACE_ID=afdb6a3e-3939-40aa-92df-01604c23101c
  OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
  ```

### 3. worker-grants
- **What it is:** Grants advisor agent (Asian woman avatar, nova voice)
- **Root Directory:** `services/worker-grants`
- **Start Command:** `python main.py start`
- **Env vars needed:**
  ```
  LIVEKIT_URL=wss://your-project.livekit.cloud
  LIVEKIT_API_KEY=APIxxxxxxxxx
  LIVEKIT_API_SECRET=xxxxxxxxxxxxxx
  SIMLI_API_KEY=your_simli_key
  SIMLI_GRANTS_FACE_ID=cace3ef7-a4c4-425d-a8cf-a5358eb0c427
  OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
  RAG_BACKEND_URL=http://cooperative-hope.railway.internal:8000
  ```

### 4. cooperative-hope
- **What it is:** RAG backend with grants database (Python FastAPI)
- **Root Directory:** `rag-backend`
- **Start Command:** Auto-detected (runs Dockerfile)
- **Env vars needed:**
  ```
  PORT=8000
  ```
- **Database:** Auto-ingests 124 grant entries on startup from `data/art_grants_residencies_kb.json`

## How It Works

### User Interaction Flow
1. User visits https://avatar-hub-production.up.railway.app/
2. User clicks avatar in dock (tax or grants)
3. Frontend calls `/api/livekit-token` to get room token
4. Frontend connects to LiveKit room via WebSocket
5. Worker agent (already running on Railway) joins the same room
6. User speaks → Worker processes → User hears avatar response

### Tax Agent Flow
```
User speaks
  → LiveKit captures audio
  → worker-tax receives audio
  → OpenAI Realtime API (STT → LLM → TTS)
  → Simli animates face with audio
  → User sees/hears avatar response
```

### Grants Agent Flow
```
User asks about grants
  → LiveKit captures audio
  → worker-grants receives audio
  → OpenAI STT converts to text
  → OpenAI LLM calls search_art_grants function
  → Worker queries RAG backend (cooperative-hope)
  → RAG backend searches 124 grant entries
  → Returns relevant grants
  → OpenAI LLM formulates response
  → OpenAI TTS generates audio
  → Simli animates face with audio
  → User sees/hears avatar response with grant recommendations
```

## File Structure

```
avatar-hub/
├── src/                          # React frontend
│   ├── components/
│   │   └── StageLiveKit.tsx     # LiveKit room connection
│   └── config/
│       └── avatars.ts            # Avatar thumbnails config
├── server/
│   └── index.ts                  # Express backend (token generation)
├── services/
│   ├── worker-tax/
│   │   └── main.py               # Tax advisor LiveKit agent
│   └── worker-grants/
│       └── main.py               # Grants advisor LiveKit agent
├── rag-backend/                  # Separate RAG service
│   ├── app/main.py
│   ├── services/vector_store.py
│   └── data/
│       └── art_grants_residencies_kb.json  # 124 grant entries
└── public/
    └── agents/
        ├── tax-specialist/
        │   └── afdb6a3e...mp4    # Indian woman thumbnail
        └── grant-specialist/
            └── requirements.mp4   # Asian woman thumbnail
```

## Current Status

✅ **Working:**
- Tax agent responds with nova voice
- Grants agent connects to RAG backend
- LiveKit room creation and connection
- Simli avatar faces display correctly
- Auto-ingestion of grants database on startup

⏳ **In Progress:**
- Grants database loading (should work after latest deployment)

🔜 **TODO:**
- Switch to ElevenLabs custom voices (currently using OpenAI voices)
- Add 2 more agents (brainstormer, crit)
- Frontend UI improvements

## Testing Checklist

1. **Tax Agent:**
   - Go to https://avatar-hub-production.up.railway.app/
   - Click tax avatar (should show Indian woman face in dock)
   - Click "Connect"
   - Wait 30 seconds for worker to start
   - Ask: "How do quarterly estimated taxes work?"
   - Should get response in nova voice

2. **Grants Agent:**
   - Click grants avatar (should show Asian woman face in dock)
   - Click "Connect"
   - Wait 30 seconds
   - Ask: "What grants are available for painters?"
   - Should get specific grant recommendations from database

## Troubleshooting

### Agent doesn't appear
- Check Railway logs for worker service
- Verify LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET are set
- Wait full 30 seconds on first connect (worker cold start)

### Grants agent says "no database"
- Check cooperative-hope logs
- Should see: `ChromaDB initialized with 124 documents`
- If sees 0 documents, check that JSON ingestion worked

### Wrong avatar face in dock
- Check `src/config/avatars.ts`
- Tax should point to `/agents/tax-specialist/afdb6a3e...mp4`
- Grants should point to `/agents/grant-specialist/requirements.mp4`

## Not Using

❌ Simli built-in agents (we use LiveKit agents instead)
❌ Local development (everything runs on Railway)
❌ ElevenLabs voices yet (using OpenAI Realtime voices for now)
❌ Direct browser → Simli connection (goes through LiveKit)
