# What to Do Next - Step by Step

## Current Status

✅ Code pushed to GitHub (commit: 9855b39)
✅ RAG backend exists with auto-updater
✅ Tax specialist updated for ElevenLabs
✅ Grant specialist updated with RAG integration
✅ Fallback versions created (OpenAI voices)
⏳ Railway services building...

## Step 1: Set Environment Variables in Railway

### Tax Worker Service
```bash
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxx
SIMLI_API_KEY=your_simli_api_key
SIMLI_FACE_ID=afdb6a3e-3939-40aa-92df-01604c23101c
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
ELEVEN_API_KEY=sk_xxxxxxxxxxxxxxxx        # IMPORTANT: ELEVEN_API_KEY not ELEVENLABS_API_KEY
ELEVENLABS_VOICE_ID=NaKPQmdr7mMxXuXrNeFC
```

### Grant Worker Service
```bash
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxx
SIMLI_API_KEY=your_simli_api_key
SIMLI_FACE_ID=cace3ef7-a4c4-425d-a8cf-a5358eb0c427
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
ELEVEN_API_KEY=sk_xxxxxxxxxxxxxxxx        # IMPORTANT
ELEVENLABS_VOICE_ID=OYTbf65OHHFELVut7v2H
RAG_BACKEND_URL=http://rag-backend.railway.internal:8000  # Replace 'rag-backend' with your service name
```

## Step 2: Watch Railway Logs

### For Tax Worker - Look For:

**✅ Success:**
```
INFO - Simli avatar started
INFO - Agent session started
```

**❌ ElevenLabs Problems:**
```
ValueError: ElevenLabs API key is required
ERROR - Failed to initialize TTS
```

**If you see errors:** Go to Step 3 (Fallback)

### For Grant Worker - Look For:

**✅ Success:**
```
INFO - Simli avatar started
INFO - Agent session started with RAG-powered grants search
```

**❌ RAG Backend Problems:**
```
ERROR - RAG backend error
Connection refused
```

**If RAG errors:** Check `RAG_BACKEND_URL` is correct

## Step 3: If ElevenLabs Fails - Quick Fallback

### Option A: Test Your API Key First

Run diagnostic script locally:
```bash
python test-elevenlabs-api.py
```

This will tell you exactly what's wrong with your ElevenLabs setup.

### Option B: Use OpenAI Voices Temporarily

**In Railway, for each worker:**

1. Go to service settings → Files
2. Find `main.py`
3. Find `main-openai-voice.py`
4. **Swap them:**
   - Rename `main.py` → `main-elevenlabs.py`
   - Rename `main-openai-voice.py` → `main.py`
5. Redeploy

**Result:** Avatar will use OpenAI voices (reliable, good quality)

## Step 4: Test Your Avatars

### Test Tax Advisor

1. Open your app in browser
2. Click tax advisor avatar
3. Say: **"What tax deductions can artists claim?"**

**Should hear:**
- Voice responds (ElevenLabs or OpenAI)
- Avatar lips sync
- Relevant tax advice

### Test Grant Expert

1. Click grant expert avatar
2. Say: **"What art residencies are available in New York?"**

**Should hear:**
- Voice responds
- Avatar lips sync
- **Specific grants/residencies from database**

**If generic answer:** RAG backend not connected properly

## Step 5: Deploy RAG Backend (If Not Already)

### Railway Configuration

**Service name:** rag-backend
**Root directory:** `rag-backend`
**Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Environment variables:**
```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
VECTOR_DB_TYPE=chroma
CHROMA_PERSIST_DIR=/app/chroma_db
KNOWLEDGE_BASE_PATH=/app/data/art_grants_residencies_kb.json
EMBEDDING_MODEL=text-embedding-ada-002
LLM_MODEL=gpt-4o
UPDATE_SCHEDULE=cron:0 0 * * *
ENABLE_WEB_SCRAPING=true
```

### Initialize Data

Once deployed:
```bash
# Trigger initial data ingestion
curl -X POST https://your-rag-backend.railway.app/ingest

# Verify it worked (wait ~30 seconds)
curl https://your-rag-backend.railway.app/admin/vector_store_info
```

Should show:
```json
{
  "total_chunks": 50,
  "sample_entries": ["OxBow School", "Bemis Center", ...]
}
```

## Step 6: Verify Everything Works

### Quick Test Checklist

- [ ] Tax worker service is running (not restarting)
- [ ] Grant worker service is running
- [ ] RAG backend service is running
- [ ] Tax avatar responds to voice
- [ ] Grant avatar responds to voice
- [ ] Grant avatar gives specific grant names (not generic advice)
- [ ] Voices sound correct (custom or OpenAI)
- [ ] No errors in Railway logs

## Common Issues & Quick Fixes

### Issue: "ElevenLabs API key is required"

**Fix:** Change `ELEVENLABS_API_KEY` → `ELEVEN_API_KEY` in Railway

### Issue: Tax avatar silent or crashes

**Fix:** Use OpenAI voice fallback (swap files as described in Step 3)

### Issue: Grant avatar gives generic advice

**Possible causes:**
1. RAG backend not running
2. `RAG_BACKEND_URL` incorrect
3. Data not ingested yet

**Fix:**
```bash
# Check RAG backend health
curl https://your-rag-backend.railway.app/health

# Check if data is loaded
curl https://your-rag-backend.railway.app/admin/vector_store_info

# Manually trigger ingestion
curl -X POST https://your-rag-backend.railway.app/ingest
```

### Issue: Grant avatar says "trouble accessing knowledge base"

**Fix:** Update `RAG_BACKEND_URL` to correct Railway internal URL:
```bash
RAG_BACKEND_URL=http://[actual-service-name].railway.internal:8000
```

## Monitoring After Deployment

### Check Update Scheduler (After 24 Hours)

```bash
# View update status
curl https://your-rag-backend.railway.app/admin/update_status

# Manually trigger update (to test)
curl -X POST https://your-rag-backend.railway.app/admin/trigger_update
```

**Watch Railway logs for:**
```
Starting knowledge base update
Collected X entries from TransArtists
Collected X entries from ResArtis RSS
...
Update completed. New: 5, Updated: 3, Errors: 0
```

### Monitor Costs

**OpenAI API Usage:**
- Tax worker: GPT-4o (per conversation)
- Grant worker: GPT-4o + embeddings (per query + daily updates)
- RAG backend: Embeddings (daily during updates)

**ElevenLabs Usage:**
- Per character spoken
- Check usage: https://elevenlabs.io/app/usage

**Railway:**
- Compute time for 3 services
- Data storage for ChromaDB

## Decision Points

### Should I Use ElevenLabs or OpenAI Voices?

**Use ElevenLabs if:**
- ✅ You need highly customized voices
- ✅ Voice quality is critical for brand
- ✅ You have a paid ElevenLabs plan
- ✅ API key works in diagnostic test

**Use OpenAI voices if:**
- ✅ You want simplicity and reliability
- ✅ Built-in voices (shimmer, nova) are good enough
- ✅ You're having ElevenLabs integration issues
- ✅ You want to minimize dependencies

**Both options work great with Simli and LiveKit!**

### How Often Should I Update the Knowledge Base?

**Daily (`cron:0 0 * * *`):**
- ✅ Most up-to-date information
- ❌ Higher OpenAI embedding costs
- Best for: High-traffic apps

**Weekly (`cron:0 0 * * 1`):**
- ✅ Lower costs
- ✅ Still relatively fresh
- Best for: Most use cases

**Bi-weekly (`cron:0 0 1,15 * *`):**
- ✅ Lowest costs
- ❌ Might miss time-sensitive opportunities
- Best for: Budget-conscious deployments

## Files Reference

| File | Purpose |
|------|---------|
| `services/worker-tax/main.py` | Tax advisor with ElevenLabs |
| `services/worker-tax/main-openai-voice.py` | Tax advisor fallback |
| `services/worker-grants/main.py` | Grant expert with RAG + ElevenLabs |
| `services/worker-grants/main-openai-voice.py` | Grant expert fallback |
| `test-elevenlabs-api.py` | Diagnostic tool for ElevenLabs |
| `DEPLOYMENT_GUIDE.md` | Full deployment documentation |
| `RAILWAY_ENV_VARS.md` | Quick env var reference |
| `ELEVENLABS_TROUBLESHOOTING.md` | ElevenLabs debugging guide |

## Get Help

1. **Check Railway logs** - Most issues show up here
2. **Run diagnostic script** - `python test-elevenlabs-api.py`
3. **Test RAG backend** - curl the health endpoint
4. **Use fallback versions** - OpenAI voices always work
5. **Check documentation** - Everything is documented

## Success Metrics

You'll know everything is working when:

1. ✅ Both avatars respond to voice
2. ✅ Tax advisor gives specific tax advice
3. ✅ Grant expert mentions actual grant names (OxBow, Bemis, etc.)
4. ✅ No errors in Railway logs
5. ✅ Daily updates run successfully (check after 24h)

**You're all set! Let me know if you hit any issues.** 🚀
