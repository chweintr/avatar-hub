# Railway Deployment Checklist

## Before You Start

✅ Code pushed to GitHub (commit: 9855b39)
✅ You have these API keys ready:
- LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
- SIMLI_API_KEY
- OPENAI_API_KEY
- ELEVEN_API_KEY (ElevenLabs - optional but recommended)

## Service 1: worker-tax

### Basic Settings
```
Service Name: worker-tax
Root Directory: services/worker-tax
Start Command: python main.py start
```

### Environment Variables
Copy-paste these one by one into Railway:

```
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxx
SIMLI_API_KEY=your_simli_api_key
SIMLI_FACE_ID=afdb6a3e-3939-40aa-92df-01604c23101c
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
ELEVEN_API_KEY=sk_xxxxxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=NaKPQmdr7mMxXuXrNeFC
```

### After Deployment
- [ ] Service shows "Active" (not restarting)
- [ ] Logs show: "Simli avatar started"
- [ ] Logs show: "Agent session started"
- [ ] No error about "ElevenLabs API key"

## Service 2: worker-grants

### Basic Settings
```
Service Name: worker-grants
Root Directory: services/worker-grants
Start Command: python main.py start
```

### Environment Variables
**IMPORTANT:** Update `RAG_BACKEND_URL` with your actual rag-backend service name!

```
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxx
SIMLI_API_KEY=your_simli_api_key
SIMLI_FACE_ID=cace3ef7-a4c4-425d-a8cf-a5358eb0c427
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
ELEVEN_API_KEY=sk_xxxxxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=OYTbf65OHHFELVut7v2H
RAG_BACKEND_URL=http://rag-backend.railway.internal:8000
```

**Note:** Replace `rag-backend` with your actual Railway service name.

### After Deployment
- [ ] Service shows "Active"
- [ ] Logs show: "Simli avatar started"
- [ ] Logs show: "Agent session started with RAG-powered grants search"
- [ ] No errors about "RAG backend"

## Service 3: rag-backend (Optional but Recommended)

### Basic Settings
```
Service Name: rag-backend
Root Directory: rag-backend
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Environment Variables - Minimal Setup
```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
VECTOR_DB_TYPE=chroma
CHROMA_PERSIST_DIR=/app/chroma_db
KNOWLEDGE_BASE_PATH=/app/data/art_grants_residencies_kb.json
EMBEDDING_MODEL=text-embedding-ada-002
LLM_MODEL=gpt-4o
UPDATE_SCHEDULE=cron:0 0 * * *
ENABLE_WEB_SCRAPING=true
```

### After Deployment

**Test health endpoint:**
```bash
curl https://your-rag-backend.railway.app/health
```

Expected response:
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

**Trigger initial data ingestion:**
```bash
curl -X POST https://your-rag-backend.railway.app/ingest
```

**Wait 30-60 seconds, then verify:**
```bash
curl https://your-rag-backend.railway.app/admin/vector_store_info
```

Expected response:
```json
{
  "total_chunks": 50,
  "sample_entries": ["OxBow School", "Bemis Center", ...],
  "collection_name": "art_grants_residencies",
  "vector_db_type": "chroma"
}
```

Checklist:
- [ ] Health endpoint returns 200 OK
- [ ] Vector store has chunks (>0)
- [ ] Sample entries show grant names

## Common Railway Issues

### Service Keeps Restarting

**Check logs for:**
```
ModuleNotFoundError: No module named 'elevenlabs'
```

**Fix:** Verify `requirements.txt` includes:
```
livekit-plugins-elevenlabs>=1.2,<1.3
```

### "ElevenLabs API key is required"

**Fix:** Check environment variable name is exactly:
```
ELEVEN_API_KEY=sk_...
```

Not `ELEVENLABS_API_KEY`!

### Grant Worker: "trouble accessing knowledge base"

**Fix:** Update `RAG_BACKEND_URL` format:
```
http://[service-name].railway.internal:8000
```

Find your service name in Railway dashboard → Services list

## Testing Your Deployment

### 1. Test Tax Advisor

**Open your app, click tax avatar, say:**
> "What can I deduct as an artist?"

**Expected:**
- Avatar responds with voice
- Mentions specific deductions (studio space, materials, etc.)
- Voice is either ElevenLabs custom or OpenAI shimmer

### 2. Test Grant Expert

**Click grant avatar, say:**
> "Tell me about art residencies in Michigan"

**Expected:**
- Avatar responds
- Mentions **specific** grants like "OxBow School of Arts"
- Provides details like location, deadlines, funding

**If response is generic:** RAG backend not connected

### 3. Verify RAG Updates

**24 hours after deployment, check logs:**

In rag-backend service logs, look for:
```
Starting knowledge base update
Collected X entries from TransArtists
Collected X entries from ResArtis RSS
...
Update completed. New: X, Updated: X, Errors: X
```

## Quick Switch to OpenAI Voices

If ElevenLabs causes issues:

### Option 1: Via Railway Dashboard

1. Go to service → Settings → Files
2. Find `main.py` and `main-openai-voice.py`
3. Rename `main.py` to `main-elevenlabs.py`
4. Rename `main-openai-voice.py` to `main.py`
5. Redeploy

### Option 2: Via Git

```bash
# For tax worker
cd services/worker-tax
mv main.py main-elevenlabs.py
mv main-openai-voice.py main.py

# For grant worker
cd ../worker-grants
mv main.py main-elevenlabs.py
mv main-openai-voice.py main.py

# Commit and push
git add .
git commit -m "Switch to OpenAI voices (ElevenLabs troubleshooting)"
git push
```

## Environment Variables Reference Card

### Critical Variables (Required)

| Variable | Where | Value Format |
|----------|-------|--------------|
| `LIVEKIT_URL` | All workers | `wss://...livekit.cloud` |
| `LIVEKIT_API_KEY` | All workers | `APIxxxxxxxxx` |
| `LIVEKIT_API_SECRET` | All workers | Long string |
| `SIMLI_API_KEY` | All workers | Your Simli key |
| `OPENAI_API_KEY` | All services | `sk-...` |

### Service-Specific

| Variable | Service | Purpose |
|----------|---------|---------|
| `SIMLI_FACE_ID` | worker-tax | Tax avatar face |
| `SIMLI_FACE_ID` | worker-grants | Grant avatar face (different!) |
| `RAG_BACKEND_URL` | worker-grants | Connect to RAG backend |
| `ELEVEN_API_KEY` | Both workers | ElevenLabs (optional) |

### Optional but Recommended

| Variable | Service | Default | Purpose |
|----------|---------|---------|---------|
| `ELEVENLABS_VOICE_ID` | workers | Auto | Custom voice |
| `UPDATE_SCHEDULE` | rag-backend | Daily | How often to update |
| `ENABLE_WEB_SCRAPING` | rag-backend | true | Scrape grant sites |

## Final Checklist

Before you tell users it's live:

- [ ] All 3 services show "Active" in Railway
- [ ] Tax advisor responds to voice
- [ ] Grant advisor responds to voice
- [ ] Grant advisor mentions specific grant names
- [ ] No errors in any service logs
- [ ] RAG backend health check passes
- [ ] Vector store has data (check /admin/vector_store_info)
- [ ] You've tested both avatars end-to-end

## Support

If stuck:
1. Check Railway logs (most issues appear here)
2. Run `python test-elevenlabs-api.py` for ElevenLabs issues
3. Curl RAG backend endpoints to verify connectivity
4. Use OpenAI voice fallback if ElevenLabs problematic
5. Review `ELEVENLABS_TROUBLESHOOTING.md`

## Success!

When everything works:
- ✅ Tax advisor gives specific tax advice
- ✅ Grant advisor searches real database
- ✅ Both voices sound natural
- ✅ Auto-updates run daily
- ✅ No errors in logs

**You're done! The system will now automatically keep grant data updated.** 🎉
