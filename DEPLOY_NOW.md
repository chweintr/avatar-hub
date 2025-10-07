# Deploy Tax & Grants Avatars - Quick Guide

## Railway Services Needed

You need **3 services** total:

1. **Web** (already exists) - React + Express
2. **worker-tax** (new) - Tax advisor agent
3. **worker-grants** (new) - Grants advisor agent

---

## Environment Variables

### Web Service
```
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxx
```

### worker-tax Service
```
# LiveKit (copy from web service)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxx

# Simli
SIMLI_API_KEY=your_simli_api_key
SIMLI_FACE_ID=afdb6a3e-3939-40aa-92df-01604c23101c

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
```

### worker-grants Service
```
# LiveKit (same as tax)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxx

# Simli
SIMLI_API_KEY=your_simli_api_key
SIMLI_FACE_ID=cace3ef7-a4c4-425d-a8cf-a5358eb0c427

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
```

---

## Deployment Steps

### 1. Deploy Workers

#### worker-tax
1. Railway → New Service
2. Connect to GitHub repo
3. Root Directory: `services/worker-tax`
4. Add all env vars from above
5. Deploy

#### worker-grants
1. Railway → New Service
2. Connect to GitHub repo
3. Root Directory: `services/worker-grants`
4. Add all env vars from above
5. Deploy

### 2. Verify Workers Started
Check logs for each worker:
```
✓ Worker started
✓ Simli avatar started
✓ Agent session started
```

### 3. Test the App
1. Visit your web app URL
2. Should see 2 avatars: Tax and Grants
3. Click Tax → Click Connect → Speak
4. Should see video + hear response
5. Try Grants avatar same way

---

## Troubleshooting

### Worker won't start
**Check logs for:**
- Import errors → verify requirements.txt deployed
- "SIMLI_API_KEY not found" → add env var
- "LIVEKIT_URL not found" → add env var

### Browser says "Token 500"
- Web service missing LIVEKIT_* vars
- Check `/api/livekit-token?room=avatar-tax&user=test` returns JSON

### Avatar video doesn't appear
- Check LiveKit dashboard → Rooms → avatar-tax
- Should see 2 participants: you + worker
- If worker missing: check worker logs for errors
- If both present but no video: check SIMLI_FACE_ID is correct

### Can hear avatar but can't see it
- Browser console → look for `[livekit] track subscribed: video`
- If missing: worker not publishing video track
- Check worker has SIMLI_FACE_ID set

### Avatar doesn't respond to voice
- Browser console → look for `[livekit] microphone enabled`
- If missing: mic permission denied
- Check OPENAI_API_KEY is set in worker
- Check worker logs for "Audio received" or errors

---

## Quick Checklist

**Before testing:**
- [ ] All 3 services deployed on Railway
- [ ] worker-tax has 5 env vars (LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, SIMLI_API_KEY, SIMLI_FACE_ID, OPENAI_API_KEY)
- [ ] worker-grants has same 5 env vars (different SIMLI_FACE_ID)
- [ ] Web service has 3 env vars (LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
- [ ] Worker logs show "Agent session started"
- [ ] Web app loads with 2 avatars visible

**After clicking Connect:**
- [ ] Browser asks for mic permission
- [ ] LiveKit room shows 2 participants
- [ ] Avatar video appears in circle
- [ ] Can speak and hear response

---

## Face IDs Reference

Tax: `afdb6a3e-3939-40aa-92df-01604c23101c`
Grants: `cace3ef7-a4c4-425d-a8cf-a5358eb0c427`

## Copy/Paste for Other Avatars Later

To add Brain or Crit avatars:
1. Copy `services/worker-tax` → `services/worker-brain`
2. Change instructions in main.py
3. Add to Railway with different SIMLI_FACE_ID
4. Uncomment avatar in `src/config/avatars.ts`

That's it!
