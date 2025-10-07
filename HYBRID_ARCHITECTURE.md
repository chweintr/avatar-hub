# Hybrid Avatar Architecture

## Overview
Mix simple Simli-hosted agents with complex custom backends in the same app.

## Two Integration Paths

### Path 1: Browser SDK (Simple Agents)
**Use for:** Avatars with pre-configured Simli agents (voice, prompt set in Simli dashboard)

**Examples:** Tax Advisor, Brainstormer, Crit Partner

**Architecture:**
```
User Browser
  ↓
StageSimli Component (React)
  ↓
Simli Browser SDK (simli-client npm package)
  ↓
Simli Hosted Agent (agentId configured with voice + prompt)
  ↓
User hears response
```

**Avatar Config:**
```typescript
{
  id: "tax",
  name: "Tax Advisor for Artists",
  provider: "simli",  // signals to use StageSimli component
  faceId: "afdb6a3e-3939-40aa-92df-01604c23101c",
  agentId: "d951e6dc-c098-43fb-a34f-e970cd339ea6",  // Simli hosted agent
  scale: 0.82
}
```

**Pros:**
- No backend required
- Instant setup
- Simli handles STT/TTS/LLM
- Pre-configured voice and personality

**Cons:**
- Can't customize LLM beyond Simli's options
- No custom knowledge base (RAG)
- Limited to Simli's agent capabilities

---

### Path 2: LiveKit Worker (Complex Backends)
**Use for:** Avatars needing custom logic, RAG, or specific LLM configurations

**Examples:** Grant Expert (uses RAG backend with ChromaDB)

**Architecture:**
```
User Browser
  ↓
StageLiveKit Component (React)
  ↓
LiveKit Cloud Room
  ↑                    ↓
User publishes mic     Worker subscribes to user audio
                       ↓
                  LiveKit Worker (Python)
                       ↓
                  OpenAI Realtime / Custom LLM
                       ↓
                  (Optional) RAG Backend / Custom Logic
                       ↓
                  Simli Plugin (generates lip-sync video)
                       ↓
                  Publishes to LiveKit Room
                       ↓
User sees/hears avatar
```

**Avatar Config:**
```typescript
{
  id: "grants",
  name: "Grant / Residency Expert",
  provider: "livekit",  // signals to use StageLiveKit component
  room: "avatar-grants",  // LiveKit room name
  scale: 0.80
}
```

**Worker Requirements:**
```python
# services/worker-grants/main.py
from livekit.agents import AgentSession
from livekit.plugins import openai, simli

session = AgentSession(
    llm=openai.realtime.RealtimeModel(voice="alloy")
)

avatar = simli.AvatarSession(
    simli_config=simli.SimliConfig(
        api_key=os.getenv("SIMLI_API_KEY"),
        face_id=os.getenv("GRANTS_FACE_ID"),
    ),
)

await avatar.start(session, room=ctx.room)
await session.start(agent=Agent(instructions="..."), room=ctx.room)
```

**Pros:**
- Full control over LLM/prompts
- Can integrate RAG/vector databases
- Can call external APIs
- Can use any TTS provider
- Can implement complex conversation flows

**Cons:**
- Requires worker deployment
- More complex setup
- Need to manage LiveKit credentials

---

## Implementation Strategy

### Frontend (React)
Update `AppLanding.tsx` to route based on `provider`:

```typescript
{active && (
  active.provider === "simli" ? (
    <StageSimli
      faceId={active.faceId}
      agentId={active.agentId}
      scale={active.scale}
    />
  ) : (
    <StageLiveKit
      roomName={active.room}
    />
  )
)}
```

### Avatar Configuration
```typescript
// src/config/avatars.ts
export const AVATARS = [
  // Simple Simli agent
  {
    id: "tax",
    provider: "simli",
    faceId: "afdb6a3e-3939-40aa-92df-01604c23101c",
    agentId: "d951e6dc-c098-43fb-a34f-e970cd339ea6",
    // ... voice/prompt configured in Simli dashboard
  },

  // Complex LiveKit + RAG backend
  {
    id: "grants",
    provider: "livekit",
    room: "avatar-grants",
    // Worker uses GRANTS_FACE_ID env var for Simli face
  },
];
```

### Railway Deployment

**Web Service (shared):**
```
LIVEKIT_URL=wss://...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
SIMLI_API_KEY=...  # for browser SDK
```

**Worker Services (one per LiveKit avatar):**
```
# worker-grants service
LIVEKIT_URL=wss://...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
SIMLI_API_KEY=...
GRANTS_FACE_ID=cace3ef7-a4c4-425d-a8cf-a5358eb0c427
OPENAI_API_KEY=...
RAG_BACKEND_URL=http://rag-backend.railway.internal:8000  # if using RAG
```

---

## When to Use Which Path

### Use Browser SDK (Path 1) when:
- Avatar has simple, predictable conversations
- Don't need custom knowledge base
- Simli's voice options work for you
- Want fastest time-to-deploy

### Use LiveKit Worker (Path 2) when:
- Need RAG/vector database integration
- Want full control over conversation flow
- Need to call external APIs during conversation
- Want to use specific LLM models/parameters
- Need ElevenLabs or custom TTS

---

## Migration Path
Start all avatars on Path 1 (browser SDK). When you need custom logic for an avatar:

1. Create worker service for that avatar
2. Change avatar config `provider: "simli"` → `provider: "livekit"`
3. Add worker env vars to Railway
4. Deploy worker

No changes needed to other avatars!
