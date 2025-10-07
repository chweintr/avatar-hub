# ✅ Setup Complete - What Changed

## Summary

Your avatar hub now has **full RAG-powered grant specialist** with **automated knowledge base updates**.

## What Was Fixed

### 1. Tax Specialist - ElevenLabs Voice ✅
**File:** `services/worker-tax/main.py`

**Changed:**
- ❌ Was using: OpenAI Realtime with `voice="shimmer"`
- ✅ Now using: OpenAI LLM + ElevenLabs TTS with custom voice

**Result:** Tax advisor now uses your custom ElevenLabs voice `NaKPQmdr7mMxXuXrNeFC`

### 2. Grant Specialist - RAG Integration ✅
**File:** `services/worker-grants/main.py`

**What it does:**
- Connects to RAG backend via `RAG_BACKEND_URL`
- Uses `search_art_grants()` function to query ChromaDB
- Returns actual grant/residency data from knowledge base
- Uses ElevenLabs voice `OYTbf65OHHFELVut7v2H`

**Architecture:**
```
User asks about grants
  ↓
Grant worker receives query via LiveKit
  ↓
Calls search_art_grants() function
  ↓
Sends query to RAG backend
  ↓
RAG backend searches ChromaDB
  ↓
Returns relevant grants/residencies
  ↓
GPT-4o formats response
  ↓
ElevenLabs speaks it
  ↓
Simli shows avatar speaking
```

### 3. Automated Data Updater ✅
**Already existed in:** `rag-backend/services/data_updater.py`

**Features:**
- ✅ Web scraping from 5+ art grant sites
- ✅ RSS feed parsing
- ✅ API integration support
- ✅ Deduplication by content hash
- ✅ Automatic vector store re-ingestion
- ✅ Configurable update schedule
- ✅ Webhook notifications

**Pre-configured sources:**
1. TransArtists (https://www.transartists.org/air)
2. ResArtis RSS (https://resartis.org/feed/)
3. Alliance of Artists Communities
4. Res Artist
5. Creative Capital

## Railway Configuration

### For Grant Specialist to Work:

**In worker-grants service, add:**
```bash
RAG_BACKEND_URL=http://rag-backend.railway.internal:8000
```

**In rag-backend service, set:**
```bash
UPDATE_SCHEDULE=cron:0 0 * * *  # Daily at midnight
ENABLE_WEB_SCRAPING=true
```

## Files Modified

```
services/worker-tax/main.py          → Added ElevenLabs TTS
services/worker-grants/main.py       → Added RAG integration
services/worker-grants/requirements.txt → Added httpx dependency
DEPLOYMENT_GUIDE.md                  → Created (full guide)
RAILWAY_ENV_VARS.md                  → Created (quick reference)
```

## Files Already Existing (No Changes Needed)

```
rag-backend/app/main.py              → FastAPI app with all endpoints
rag-backend/services/vector_store.py → ChromaDB integration
rag-backend/services/data_updater.py → Web scraping + deduplication
rag-backend/services/scheduler.py    → APScheduler for updates
rag-backend/services/retrieval.py    → RAG search logic
rag-backend/services/llm_service.py  → GPT-4o integration
agents/grant-specialist/art_grants_residencies_kb.json → Your seed data
```

## Next Steps

### 1. Deploy to Railway

**Order matters:**
1. Deploy `rag-backend` first
2. Trigger initial ingestion: `POST /ingest`
3. Deploy `worker-tax`
4. Deploy `worker-grants`

### 2. Test Each Service

```bash
# Test RAG backend health
curl https://your-rag-backend.railway.app/health

# Test knowledge base
curl https://your-rag-backend.railway.app/admin/vector_store_info

# Test a query
curl -X POST https://your-rag-backend.railway.app/query \
  -H "Content-Type: application/json" \
  -d '{"query": "art residencies with housing"}'
```

### 3. Monitor First Update

After 24 hours (based on schedule), check Railway logs for:
```
Starting knowledge base update
Collected X entries from TransArtists
Collected X entries from ResArtis RSS
...
Update completed. New: X, Updated: X, Errors: X
```

### 4. Talk to Your Avatars

**Tax Advisor:**
- "What can I deduct for my art studio?"
- "How do quarterly estimated taxes work?"

**Grant Expert:**
- "What art residencies are available in Europe?"
- "Tell me about grants for sculptors"
- "Which residencies provide housing?"

## How It All Works Together

### Tax Specialist (Simple)
```
User speaks
  → OpenAI LLM (gpt-4o) processes
  → ElevenLabs TTS speaks
  → Simli shows avatar
```

### Grant Specialist (RAG-Powered)
```
User speaks
  → OpenAI LLM (gpt-4o) with function calling
  → Calls search_art_grants(query)
  → HTTP request to RAG backend
  → ChromaDB searches embeddings
  → Returns relevant grants
  → GPT-4o formats answer
  → ElevenLabs TTS speaks
  → Simli shows avatar
```

### RAG Backend (Autonomous)
```
Scheduler runs (daily at midnight)
  → Scrapes 5+ websites
  → Parses RSS feeds
  → Extracts grant/residency data
  → Deduplicates by hash
  → Updates art_grants_residencies_kb.json
  → Re-ingests into ChromaDB
  → Creates new embeddings
  → Ready for next query
```

## Key Differences Between Agents

| Feature | Tax Specialist | Grant Specialist |
|---------|---------------|------------------|
| Knowledge Source | System prompt only | RAG + ChromaDB |
| Voice | ElevenLabs custom | ElevenLabs custom |
| LLM | GPT-4o | GPT-4o |
| Function Calling | No | Yes (`search_art_grants`) |
| Auto-Updates | No | Yes (via RAG backend) |
| Data Sources | Static prompt | 5+ websites + RSS |
| Simli Face ID | afdb6a3e... | cace3ef7... |

## Environment Variables Summary

### Tax Worker
- Standard agent setup
- ElevenLabs voice
- No backend dependency

### Grant Worker
- Standard agent setup
- ElevenLabs voice
- **Requires:** `RAG_BACKEND_URL`

### RAG Backend
- OpenAI API key (embeddings + GPT-4o)
- ChromaDB configuration
- Update schedule
- Optional: webhook notifications

## Troubleshooting Quick Fixes

**Tax voice not working?**
→ Check `ELEVEN_API_KEY` is set (not `ELEVENLABS_API_KEY`)

**Grant agent doesn't know anything?**
→ Check `RAG_BACKEND_URL` and verify rag-backend is running

**No updates happening?**
→ Check scheduler logs and try `/admin/trigger_update`

**Want to add more sources?**
→ Set `CUSTOM_DATA_SOURCES` env var as JSON array

## Documentation Reference

- **Full Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **Env Vars Quick Reference:** `RAILWAY_ENV_VARS.md`
- **This Summary:** `SETUP_COMPLETE.md`

## Support

If you have issues:
1. Check Railway logs for each service
2. Test RAG backend endpoints directly
3. Verify environment variables are set exactly as shown
4. Try manual update trigger to test scraping

## What's Next?

Optional enhancements:
- Add more custom data sources
- Adjust update schedule frequency
- Set up Slack/Discord webhooks for update notifications
- Fine-tune chunk size and overlap for better retrieval
- Add more ElevenLabs voices for other avatar types
