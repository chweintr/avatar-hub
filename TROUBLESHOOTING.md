# Troubleshooting Guide - Avatar Hub

## Quick Diagnostic Checklist

### Tax Advisor Agent Not Showing Up

**Symptoms:**
- Agent doesn't appear on stage when you click "Connect"
- Status shows "Idle" or "Disconnected"

**Solutions:**

1. **Check Railway Worker Service Logs** (worker-tax):
   ```
   Look for these messages:
   ✓ "Starting tax advisor agent in room: avatar-tax"
   ✓ "Using Simli face ID: afdb6a3e-3939-40aa-92df-01604c23101c"
   ✓ "Simli avatar started successfully"

   ❌ If you see errors about missing env vars, continue below
   ```

2. **Verify Environment Variables** (Railway → worker-tax service → Variables):
   ```bash
   # Required for tax agent:
   LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=APIxxxxxxxxx
   LIVEKIT_API_SECRET=xxxxxxxxxxxxxx
   SIMLI_API_KEY=your_simli_api_key
   SIMLI_FACE_ID=afdb6a3e-3939-40aa-92df-01604c23101c
   OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
   ```

3. **Check LiveKit Dashboard**:
   - Go to your LiveKit Cloud dashboard
   - Check "Rooms" → should see "avatar-tax" room when you click Connect
   - Should see 2 participants: your browser + the avatar agent
   - If only 1 participant: worker isn't connecting (check logs)

4. **Worker Service Status**:
   - Make sure worker-tax service is deployed and running in Railway
   - Check it has the correct Start Command: `python main.py start`
   - Root Directory should be: `services/worker-tax`

---

### Grant Agent Says "No Database Access"

**Symptoms:**
- Agent appears but says "I can't access my knowledge base"
- Agent says "database service isn't running"

**Solutions:**

1. **Check Railway Worker Logs** (worker-grants):
   ```
   Look for:
   ✓ "✓ Connecting to RAG backend at: http://rag-backend.railway.internal:8000"

   ❌ If you see:
   "⚠️  RAG_BACKEND_URL environment variable not set!"
   → RAG_BACKEND_URL is missing (see step 2)

   "❌ RAG backend connection error - cannot reach..."
   → RAG backend service isn't running (see step 3)
   ```

2. **Set RAG_BACKEND_URL** (Railway → worker-grants → Variables):
   ```bash
   # Add this variable:
   RAG_BACKEND_URL=http://rag-backend.railway.internal:8000

   # Replace 'rag-backend' with your actual RAG service name in Railway
   # Format: http://[service-name].railway.internal:8000
   ```

3. **Check RAG Backend Service**:
   - Make sure `rag-backend` service exists in Railway
   - Check it's running (not crashed)
   - Root Directory should be: `rag-backend`
   - Check its logs for: "All services initialized successfully"

4. **Verify RAG Backend Environment Variables**:
   ```bash
   # Required in rag-backend service:
   OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
   PORT=8000
   ```

5. **Test RAG Backend Health**:
   ```bash
   # From Railway logs or local testing:
   curl https://your-rag-backend.railway.app/health

   # Should return:
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

6. **Initialize RAG Database** (if needed):
   ```bash
   # Trigger data ingestion:
   curl -X POST https://your-rag-backend.railway.app/ingest

   # Check logs for: "Data ingestion started in background"
   ```

---

## Environment Variables Reference

### Frontend/Server Service (avatar-hub)
```bash
NODE_ENV=production
PORT=${{PORT}}
LIVEKIT_URL=wss://your-livekit-cloud.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxx
```

### Tax Worker Service (worker-tax)
```bash
# LiveKit (same as frontend)
LIVEKIT_URL=wss://your-livekit-cloud.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxx

# Simli
SIMLI_API_KEY=your_simli_api_key
SIMLI_FACE_ID=afdb6a3e-3939-40aa-92df-01604c23101c

# AI
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
```

### Grants Worker Service (worker-grants)
```bash
# LiveKit (same as frontend)
LIVEKIT_URL=wss://your-livekit-cloud.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxx

# Simli
SIMLI_API_KEY=your_simli_api_key
SIMLI_FACE_ID=cace3ef7-a4c4-425d-a8cf-a5358eb0c427

# AI
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx

# RAG Backend Connection
RAG_BACKEND_URL=http://rag-backend.railway.internal:8000
```

### RAG Backend Service (rag-backend)
```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
PORT=8000
DEBUG=false
CORS_ORIGINS=["*"]
CHROMA_PERSIST_DIR=/app/chroma_db
UPDATE_SCHEDULE=0 2 * * *
```

---

## Common Error Messages

### "SIMLI_API_KEY is required"
**Cause:** Missing SIMLI_API_KEY environment variable
**Fix:** Add SIMLI_API_KEY to the worker service in Railway

### "SIMLI_FACE_ID is required"
**Cause:** Missing SIMLI_FACE_ID (or SIMLI_TAX_FACE_ID/SIMLI_GRANTS_FACE_ID)
**Fix:** Add SIMLI_FACE_ID with the correct face ID to the worker service

### "RAG backend connection error"
**Cause:** RAG backend service not reachable
**Fix:**
1. Check rag-backend service is running in Railway
2. Verify RAG_BACKEND_URL uses correct service name
3. Ensure both services are in the same Railway project

### "Knowledge base not initialized"
**Cause:** RAG backend hasn't ingested data yet
**Fix:** POST to `/ingest` endpoint to trigger data ingestion

### "Token 500" in frontend
**Cause:** LiveKit credentials missing or incorrect in frontend service
**Fix:** Verify LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET in avatar-hub service

---

## Testing After Fixes

### Test Tax Agent:
1. Deploy updated worker-tax code
2. Check Railway logs for: "✓ Simli avatar started successfully"
3. Visit your app → Click Tax Advisor → Click Connect
4. Avatar should appear within 5 seconds
5. Speak → avatar should respond

### Test Grants Agent:
1. Ensure RAG backend is deployed and healthy
2. Set RAG_BACKEND_URL in worker-grants
3. Deploy updated worker-grants code
4. Check logs for: "✓ Connecting to RAG backend at..."
5. Visit app → Click Grant Expert → Click Connect
6. Avatar should appear
7. Ask about grants → should search database and respond

---

## Railway Deployment Checklist

- [ ] **Frontend Service** (avatar-hub) deployed with LiveKit credentials
- [ ] **Tax Worker** (worker-tax) deployed with Simli + OpenAI credentials
- [ ] **Grants Worker** (worker-grants) deployed with Simli + OpenAI + RAG_BACKEND_URL
- [ ] **RAG Backend** (rag-backend) deployed with OpenAI credentials
- [ ] All services in same Railway project (for internal networking)
- [ ] Data ingested in RAG backend (`POST /ingest`)
- [ ] Both agents tested and working

---

## Need More Help?

1. **Check Service Logs** - Railway dashboard → service → Logs tab
2. **Verify Environment Variables** - Railway dashboard → service → Variables tab
3. **Test Endpoints Individually**:
   - Frontend health: `GET /health`
   - LiveKit token: `GET /api/livekit-token?room=avatar-tax&user=test`
   - RAG backend health: `GET /health` (on rag-backend service)
4. **LiveKit Dashboard** - Check active rooms and participants
5. **Simli Dashboard** - Verify face IDs and API key validity
