# ElevenLabs Integration Troubleshooting

## Common Issues & Solutions

### Issue 1: "ElevenLabs API key is required"

**Symptom:** Railway logs show:
```
ValueError: ElevenLabs API key is required, either as argument or set ELEVEN_API_KEY environmental variable
```

**Solution:**
The plugin looks for `ELEVEN_API_KEY` (not `ELEVENLABS_API_KEY`).

In Railway environment variables, set:
```bash
ELEVEN_API_KEY=sk_xxxxxxxxxxxxxxxx
```

### Issue 2: Worker crashes on startup

**Symptom:** Service keeps restarting, logs show import errors

**Check requirements.txt has:**
```
livekit-plugins-elevenlabs>=1.2,<1.3
```

**Verify it installed:**
Check Railway build logs for:
```
Successfully installed livekit-plugins-elevenlabs-1.2.x
```

### Issue 3: Still hearing OpenAI voice

**Symptoms:**
- No errors in logs
- Avatar speaks but voice sounds like OpenAI's built-in voices

**Possible causes:**

1. **Environment variable not set correctly**
   - Check Railway dashboard: `ELEVEN_API_KEY` exists
   - No typos in the key
   - Key starts with `sk_`

2. **Old code still deployed**
   - Verify git push completed
   - Railway pulled latest commit
   - Check Railway shows latest commit hash

3. **ElevenLabs quota exceeded**
   - Check ElevenLabs dashboard usage
   - Verify API key is active

### Issue 4: Voice ID not found

**Symptom:** Error about voice ID
```
Error: Voice not found: NaKPQmdr7mMxXuXrNeFC
```

**Solution:**
1. Go to https://elevenlabs.io/app/voice-library
2. Find your voice
3. Copy the correct Voice ID
4. Update Railway env var:
   ```bash
   ELEVENLABS_VOICE_ID=your_actual_voice_id
   ```

### Issue 5: Slow response / timeout

**Symptoms:**
- Long delay before avatar speaks
- Timeout errors in logs

**Causes:**
- ElevenLabs model too slow
- Network issues between Railway and ElevenLabs

**Solutions:**

1. **Use faster model:**
   ```python
   tts=elevenlabs.TTS(
       voice_id=os.getenv("ELEVENLABS_VOICE_ID"),
       api_key=os.getenv("ELEVEN_API_KEY"),
       model="eleven_turbo_v2_5"  # Fastest model
   )
   ```

2. **Check ElevenLabs status:**
   - https://status.elevenlabs.io/

3. **Increase timeout** (if needed):
   - Not recommended, but possible in agent config

## Quick Switch to OpenAI Voices (Fallback)

If ElevenLabs continues to have issues, you can temporarily use OpenAI voices.

### For Tax Worker:

**In Railway, edit `services/worker-tax/main.py`:**

Find this section:
```python
session = AgentSession(
    llm=openai.LLM(model="gpt-4o"),
    tts=elevenlabs.TTS(
        voice_id=os.getenv("ELEVENLABS_VOICE_ID", "NaKPQmdr7mMxXuXrNeFC"),
        api_key=os.getenv("ELEVEN_API_KEY"),
        model="eleven_turbo_v2_5"
    ),
)
```

Replace with:
```python
session = AgentSession(
    llm=openai.LLM(model="gpt-4o"),
    tts=openai.TTS(voice="shimmer"),  # OpenAI voice
)
```

**Or use the pre-made fallback:**
1. In Railway file editor, rename `main.py` to `main-elevenlabs.py`
2. Rename `main-openai-voice.py` to `main.py`
3. Redeploy

### For Grant Worker:

Same process, but use:
```python
tts=openai.TTS(voice="nova"),  # Warm, friendly voice
```

### OpenAI Voice Options

| Voice | Description | Best For |
|-------|-------------|----------|
| `alloy` | Neutral, balanced | General purpose |
| `echo` | Male, clear | Professional |
| `fable` | Expressive, dynamic | Storytelling |
| `onyx` | Deep male | Authority |
| `nova` | Warm female | Friendly, supportive |
| `shimmer` | Bright female | Energetic, clear |

**Recommendation:**
- Tax Advisor: `shimmer` (professional, clear)
- Grant Expert: `nova` (warm, supportive)

## Testing ElevenLabs Integration

### Step 1: Check API Key

```bash
# Test your ElevenLabs API key
curl https://api.elevenlabs.io/v1/voices \
  -H "xi-api-key: sk_your_api_key_here"
```

Should return a list of available voices.

### Step 2: Check Voice ID

```bash
# Test specific voice
curl https://api.elevenlabs.io/v1/voices/NaKPQmdr7mMxXuXrNeFC \
  -H "xi-api-key: sk_your_api_key_here"
```

Should return voice details.

### Step 3: Monitor Railway Logs

When service starts, look for:
```
INFO - Simli avatar started
INFO - Agent session started
```

**Good signs:**
- No errors about API keys
- No errors about voice IDs
- Service stays running

**Bad signs:**
```
ERROR - Failed to initialize TTS
ValueError: ElevenLabs API key is required
KeyError: 'voice_id'
```

### Step 4: Test Conversation

1. Connect to avatar in frontend
2. Say: "Hello, can you hear me?"
3. Listen to the voice

**ElevenLabs working:**
- Custom voice you selected
- Natural speech patterns
- Consistent voice characteristics

**OpenAI fallback active:**
- Generic AI voice
- Different voice characteristics
- Still works, but not custom

## Debugging Checklist

Use this checklist when ElevenLabs isn't working:

- [ ] `ELEVEN_API_KEY` environment variable is set in Railway
- [ ] API key starts with `sk_`
- [ ] API key copied correctly (no spaces/line breaks)
- [ ] `ELEVENLABS_VOICE_ID` environment variable is set
- [ ] Voice ID is correct (verify in ElevenLabs dashboard)
- [ ] `livekit-plugins-elevenlabs` in requirements.txt
- [ ] Latest code pushed to git
- [ ] Railway pulled latest commit (check commit hash)
- [ ] Railway build succeeded (no errors in build logs)
- [ ] Service is running (not restarting)
- [ ] No errors in Railway runtime logs
- [ ] ElevenLabs account has available quota
- [ ] ElevenLabs API is operational (check status page)

## Known Issues with ElevenLabs

### LiveKit Plugin Version Compatibility

**Issue:** Some versions of `livekit-plugins-elevenlabs` had bugs.

**Solution:** Use version `>=1.2,<1.3` as specified in requirements.txt

### Railway Cold Starts

**Issue:** First request after cold start may timeout.

**Workaround:**
- Keep service warm with health check pings
- Or accept first request might fail, retry works

### ElevenLabs Rate Limits

**Issue:** Too many requests = rate limited

**Check your plan:**
- Free tier: Limited characters/month
- Paid tier: Higher limits

**View usage:**
https://elevenlabs.io/app/usage

## Support Resources

- **ElevenLabs Docs:** https://elevenlabs.io/docs/
- **ElevenLabs Status:** https://status.elevenlabs.io/
- **LiveKit ElevenLabs Plugin:** https://docs.livekit.io/agents/plugins/elevenlabs/
- **LiveKit Discord:** https://livekit.io/discord

## Contact for Help

If you're still stuck after trying these steps:

1. **Capture Railway logs** - Copy full startup logs
2. **Check environment variables** - Screenshot (hide API keys!)
3. **Verify git commit** - Note the commit hash Railway is using
4. **Test API key** - Run curl commands above
5. **Report results** - Share what worked/didn't work

## Last Resort: Permanent OpenAI Fallback

If ElevenLabs keeps causing issues, you can permanently switch to OpenAI voices:

1. Use the `main-openai-voice.py` versions as your main files
2. Remove ElevenLabs environment variables
3. Keep the ElevenLabs versions as `main-elevenlabs.py` for future attempts
4. OpenAI voices are reliable and work well with Simli

**Pros of OpenAI fallback:**
- ✅ No additional API key needed
- ✅ Very reliable
- ✅ Good quality voices
- ✅ Fast response time
- ✅ No extra cost beyond OpenAI API

**Cons:**
- ❌ Can't customize voice as much
- ❌ Limited to 6 voices
- ❌ Less natural for some use cases

For your tax and grant advisors, OpenAI voices are perfectly acceptable if ElevenLabs continues to cause problems.
