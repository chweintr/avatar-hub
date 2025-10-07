# ✅ Working Setup - Tax Avatar is Live!

## What's Working
- Tax Advisor avatar with ElevenLabs voice
- LiveKit + Simli integration
- Disconnect button (stops API usage)

## Railway Environment Variables

### For Each Worker Service (worker-tax, worker-grants, etc.):

```bash
# LiveKit (same for all workers)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxx

# Simli (face_id changes per avatar)
SIMLI_API_KEY=your_simli_api_key
SIMLI_FACE_ID=afdb6a3e-3939-40aa-92df-01604c23101c  # Tax face

# AI Services
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=your_voice_id_here  # Different per avatar
```

## Railway Service Setup

### Settings for worker-tax:
- **Root Directory**: `services/worker-tax`
- **Start Command**: `python main.py start`
- **All variables** from above

### For worker-grants:
- **Root Directory**: `services/worker-grants`
- **Start Command**: `python main.py start`
- **Same variables** but different `SIMLI_FACE_ID` and `ELEVENLABS_VOICE_ID`

## Copy/Paste Template for New Avatars

1. **Copy worker folder**:
```bash
cp -r services/worker-tax services/worker-brain
```

2. **Edit `services/worker-brain/main.py`** - change line 44:
```python
agent=Agent(instructions="You are a creative studio brainstormer..."),
```

3. **Create Railway service**:
- Root Directory: `services/worker-brain`
- Start Command: `python main.py start`
- Add all env vars with different `SIMLI_FACE_ID` and `ELEVENLABS_VOICE_ID`

4. **Add to frontend** (`src/config/avatars.ts`):
```typescript
{
  id: "brainstormer",
  name: "Studio Brainstormer",
  room: "avatar-brain",
  scale: 0.80
}
```

5. **Deploy and test!**

## How to Use

1. Go to your app URL
2. Click avatar in dock
3. Click "Connect" button
4. **IMPORTANT**: Wait 5 seconds for worker to start
5. Speak - avatar will respond
6. Click "Disconnect" when done (stops API usage)

## Face IDs You Have

- Tax: `afdb6a3e-3939-40aa-92df-01604c23101c`
- Grants: `cace3ef7-a4c4-425d-a8cf-a5358eb0c427`
- Brain: (add yours)
- Crit: (add yours)

## ElevenLabs Voice IDs

Add one env var per worker:
```
ELEVENLABS_VOICE_ID=your_voice_id_from_elevenlabs_dashboard
```

Find voice IDs at: https://elevenlabs.io/app/voice-library

## Key Learnings

1. **Worker must be running BEFORE you click Connect**
   - First click: wait 30 seconds for worker to start
   - After that: connects instantly

2. **Disconnect when done**
   - Stops worker
   - Stops API billing
   - Click Connect again to restart

3. **Each avatar needs**:
   - Own worker service on Railway
   - Own SIMLI_FACE_ID
   - Own ELEVENLABS_VOICE_ID
   - Own instructions in Agent()

4. **Common errors**:
   - "participant disconnect" = clicked Connect before worker ready (wait 30s, try again)
   - TypeError about instructions = put instructions in Agent() not RealtimeModel()
   - No audio = missing ELEVENLABS_VOICE_ID or ELEVENLABS_API_KEY
