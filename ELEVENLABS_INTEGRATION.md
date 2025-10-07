# ElevenLabs Voice Integration Notes

## Current Status
- **Working**: OpenAI Realtime API with voice "shimmer" (female voice)
- **Goal**: Use ElevenLabs custom voice `NaKPQmdr7mMxXuXrNeFC` for tax advisor

## ElevenLabs Voice ID
```
NaKPQmdr7mMxXuXrNeFC
```
This voice is already set in Railway environment variables as `ELEVENLABS_VOICE_ID`.

## Environment Variables Needed in Railway

```bash
ELEVEN_API_KEY=sk_xxxxxxxxxxxxxxxx       # ElevenLabs API key
ELEVENLABS_VOICE_ID=NaKPQmdr7mMxXuXrNeFC  # The custom tax advisor voice
```

## Why ElevenLabs Integration Failed

### Attempt 1: Wrong parameter name
```python
tts=elevenlabs.TTS(voice=os.getenv("ELEVENLABS_VOICE_ID"))  # ❌ Wrong
```
**Error**: `TypeError: TTS.__init__() got an unexpected keyword argument 'voice'`

**Fix**: Parameter should be `voice_id` not `voice`

### Attempt 2: Missing API key
```python
tts=elevenlabs.TTS(voice_id=os.getenv("ELEVENLABS_VOICE_ID"))  # ❌ Missing API key
```
**Error**: `ValueError: ElevenLabs API key is required, either as argument or set ELEVEN_API_KEY environmental variable`

**Fix**: Must also pass `api_key` parameter or set `ELEVEN_API_KEY` env var

### Attempt 3: Explicit API key
```python
tts=elevenlabs.TTS(
    voice_id=os.getenv("ELEVENLABS_VOICE_ID"),
    api_key=os.getenv("ELEVEN_API_KEY")
)
```
**Status**: This should work but was never tested because we reverted to fix broken functionality

## Correct ElevenLabs Integration Pattern

Based on LiveKit plugin documentation and source code:

```python
from livekit.plugins import openai, elevenlabs, simli

session = AgentSession(
    llm=openai.LLM(model="gpt-4o"),  # Use full gpt-4o for better numeracy
    tts=elevenlabs.TTS(
        voice_id=os.getenv("ELEVENLABS_VOICE_ID"),  # NaKPQmdr7mMxXuXrNeFC
        api_key=os.getenv("ELEVEN_API_KEY"),        # Explicit API key
        model="eleven_turbo_v2_5"                    # Default, can customize
    ),
)
```

## Alternative: Let plugin use env var
```python
# Set ELEVEN_API_KEY in Railway, then:
session = AgentSession(
    llm=openai.LLM(model="gpt-4o"),
    tts=elevenlabs.TTS(
        voice_id=os.getenv("ELEVENLABS_VOICE_ID")
        # api_key will be read from ELEVEN_API_KEY env var automatically
    ),
)
```

## Model Recommendations

### For LLM (from expert feedback)
- **Recommended**: `gpt-4o` (full) - Better at multi-step reasoning and numeracy
- **Not recommended**: `gpt-4o-mini` - More arithmetic errors, needs stricter prompting
- **Alternative**: `gpt-4.1` (if stable in your setup)

### For TTS
- **ElevenLabs models available**:
  - `eleven_turbo_v2_5` (default, fastest)
  - `eleven_multilingual_v2`
  - `eleven_monolingual_v1`

## Next Steps to Deploy ElevenLabs

1. **Verify Railway env vars are set**:
   - `ELEVEN_API_KEY` (the actual API key from ElevenLabs)
   - `ELEVENLABS_VOICE_ID=NaKPQmdr7mMxXuXrNeFC`

2. **Update worker code**:
```python
session = AgentSession(
    llm=openai.LLM(model="gpt-4o"),  # Upgrade from gpt-4o-mini for better tax calculations
    tts=elevenlabs.TTS(
        voice_id=os.environ["ELEVENLABS_VOICE_ID"],
        api_key=os.environ["ELEVEN_API_KEY"]
    ),
)
```

3. **Test incrementally**:
   - Deploy and check Railway logs for initialization
   - Verify no `ValueError` about missing API key
   - Connect from frontend and verify voice works
   - Test that agent can hear microphone input

## Debugging Checklist

When testing ElevenLabs:
- [ ] Check Railway logs show "Simli avatar started"
- [ ] Check Railway logs show "Agent session started"
- [ ] No TypeError about 'voice' parameter
- [ ] No ValueError about missing API key
- [ ] Frontend console shows "[livekit] connected to room"
- [ ] Frontend console shows "[livekit] track subscribed: audio"
- [ ] Avatar video appears in portal
- [ ] Avatar responds to spoken input
- [ ] Voice sounds like the custom ElevenLabs voice

## Fallback Voice Options

If ElevenLabs continues to fail, OpenAI Realtime has these female voices:
- `shimmer` - Bright and energetic (currently using)
- `nova` - Warm and friendly
- `ballad` - Melodic and smooth
- `coral` - Warm and conversational
- `sage` - Calm and thoughtful

## Resources

- LiveKit ElevenLabs Plugin: https://docs.livekit.io/agents/plugins/elevenlabs/
- ElevenLabs Voice Library: https://elevenlabs.io/app/voice-library
- Plugin Source: https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-elevenlabs
