# Final Architecture Summary - Avatar Hub with RAG

## Understanding Each Component's Role

### 1. Simli = Avatar Interface Only
- **What it does**: Shows the avatar face, handles speech
- **What it DOESN'T do**: Store knowledge, answer questions
- **Think of it as**: A puppet that needs a brain

### 2. Your RAG Backend = The Brain
- **What it does**: Searches art grants database, generates answers
- **What it DOESN'T do**: Show visuals or speak
- **Think of it as**: The intelligence behind the puppet

## How Your Two Avatar Types Work

### Tax Advisor (Simple)
```
User speaks → Simli handles everything → User hears response
```
- Uses Simli's built-in agent (id: d951e6dc-c098-43fb-a34f-e970cd339ea6)
- Has its own system prompt in Simli
- Self-contained

### Grant Expert (Complex)
```
User speaks → Simli STT → Your RAG Backend → GPT-4o → Simli TTS → User hears response
```
- NO Simli agent needed
- Simli is ONLY for face + voice
- All answers come from your RAG backend

## Railway Environment Variables

Add these to your Railway project:

### Backend Service
```bash
# API Keys
OPENAI_API_KEY=sk-your-key
SIMLI_API_KEY=your-simli-key
ELEVENLABS_API_KEY=your-elevenlabs-key

# Face IDs for each avatar
FACE_ID_1=afdb6a3e-3939-40aa-92df-01604c23101c  # Tax
FACE_ID_2=cace3ef7-a4c4-425d-a8cf-a5358eb0c427  # Grants
FACE_ID_3=your-brainstormer-face-id
FACE_ID_4=your-crit-partner-face-id

# Internal URL to RAG backend
RAG_BACKEND_URL=http://rag-backend.railway.internal:8000
```

### RAG Backend Service
```bash
# Required
OPENAI_API_KEY=sk-your-key

# Voice for Grant Expert
ELEVENLABS_VOICE_ID=OYTbf65OHHFELVut7v2H

# Optional
UPDATE_SCHEDULE=cron:0 0 * * *
```

## The Flow for Grant Expert

1. User asks: "What artist residencies are in Berlin?"
2. Simli converts speech to text
3. Text sent to YOUR backend (not Simli's)
4. Your backend searches ChromaDB for Berlin residencies
5. Your backend asks GPT-4o for a nice answer
6. Answer sent back to Simli
7. Simli speaks it with avatar face + ElevenLabs voice

## Key Points

- Grant Expert does NOT need cb23e27-77a5-4b47-b3d9-b389fc687aab
- That agent ID would bypass your RAG system
- Simli should ONLY know the face + voice IDs
- Your RAG backend provides ALL the intelligence

## To Test

1. Deploy all 3 services to Railway
2. Add environment variables above
3. Run: `curl -X POST https://your-rag-backend.railway.app/ingest`
4. Visit Avatar Hub and select Grant Expert
5. Ask about art residencies - answers come from YOUR database!