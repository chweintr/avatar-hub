# Complete Deployment Guide - Avatar Hub with RAG

## System Architecture Overview

Your avatar hub has **3 Railway services**:

1. **worker-tax** - Tax advisor avatar (simple, no RAG)
2. **worker-grants** - Grant/residency expert (RAG-powered)
3. **rag-backend** - Knowledge base + auto-updater

## Railway Service Configuration

### Service 1: Tax Specialist Worker

**Root Directory:** `services/worker-tax`
**Start Command:** `python main.py start`

**Environment Variables:**
```bash
# LiveKit Configuration
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxx

# Simli Configuration
SIMLI_API_KEY=your_simli_api_key
SIMLI_FACE_ID=afdb6a3e-3939-40aa-92df-01604c23101c

# AI Services
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
ELEVEN_API_KEY=sk_xxxxxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=NaKPQmdr7mMxXuXrNeFC
```

### Service 2: Grant Specialist Worker (RAG-Powered)

**Root Directory:** `services/worker-grants`
**Start Command:** `python main.py start`

**Environment Variables:**
```bash
# LiveKit Configuration (same as tax)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxx

# Simli Configuration (different face)
SIMLI_API_KEY=your_simli_api_key
SIMLI_FACE_ID=cace3ef7-a4c4-425d-a8cf-a5358eb0c427

# AI Services
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
ELEVEN_API_KEY=sk_xxxxxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=OYTbf65OHHFELVut7v2H

# RAG Backend Connection
RAG_BACKEND_URL=http://rag-backend.railway.internal:8000
```

**Note:** The `RAG_BACKEND_URL` uses Railway's internal networking. Replace `rag-backend` with your actual service name in Railway.

### Service 3: RAG Backend (Knowledge Base + Auto-Updater)

**Root Directory:** `rag-backend`
**Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Environment Variables:**
```bash
# Required API Keys
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx

# Optional - ElevenLabs (if using TTS features)
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=OYTbf65OHHFELVut7v2H

# Vector Database Configuration
VECTOR_DB_TYPE=chroma
CHROMA_PERSIST_DIR=/app/chroma_db
KNOWLEDGE_BASE_PATH=/app/data/art_grants_residencies_kb.json

# RAG Configuration
EMBEDDING_MODEL=text-embedding-ada-002
LLM_MODEL=gpt-4o
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
NUM_RESULTS=5

# Auto-Update Configuration
UPDATE_SCHEDULE=cron:0 0 * * *
UPDATE_ON_STARTUP=false
ENABLE_WEB_SCRAPING=true
SCRAPING_TIMEOUT=30

# Optional - Slack/Discord webhook for update notifications
NOTIFICATION_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Optional - Custom data sources (JSON array)
CUSTOM_DATA_SOURCES=[]

# Application Settings
DEBUG=false
PORT=8000
```

**Important:** Copy your `art_grants_residencies_kb.json` to `/app/data/` in the Railway service.

## Update Schedule Configuration

The `UPDATE_SCHEDULE` variable accepts two formats:

### Cron Format
```bash
UPDATE_SCHEDULE=cron:MINUTE HOUR DAY MONTH DAYOFWEEK

# Examples:
UPDATE_SCHEDULE=cron:0 0 * * *          # Daily at midnight UTC
UPDATE_SCHEDULE=cron:0 2 * * 1          # Every Monday at 2 AM
UPDATE_SCHEDULE=cron:0 0 1 * *          # First day of each month
UPDATE_SCHEDULE=cron:0 */6 * * *        # Every 6 hours
```

### Interval Format
```bash
UPDATE_SCHEDULE=interval:TIME_UNIT

# Examples:
UPDATE_SCHEDULE=interval:24h            # Every 24 hours
UPDATE_SCHEDULE=interval:7d             # Every 7 days
UPDATE_SCHEDULE=interval:30m            # Every 30 minutes
```

## Data Sources Configuration

The RAG backend includes pre-configured scrapers for:

1. **TransArtists** - https://www.transartists.org/air
2. **ResArtis RSS** - https://resartis.org/feed/
3. **Alliance of Artists Communities** - https://www.artistcommunities.org/residencies
4. **Res Artist** - https://resartist.com/en/residencies/
5. **Creative Capital** - https://creative-capital.org/grants/

### Adding Custom Data Sources

Set the `CUSTOM_DATA_SOURCES` environment variable as a JSON array:

```json
[
  {
    "name": "My Custom Grant Site",
    "url": "https://example.com/grants",
    "type": "scrape",
    "enabled": true,
    "selectors": {
      "listing": ".grant-card",
      "name": ".grant-title",
      "deadline": ".deadline-date",
      "description": ".grant-description"
    }
  },
  {
    "name": "Grant RSS Feed",
    "url": "https://example.com/feed.xml",
    "type": "rss",
    "enabled": true
  },
  {
    "name": "Grant API",
    "url": "https://api.example.com/grants",
    "type": "api",
    "api_key": "your-api-key",
    "enabled": true
  }
]
```

**In Railway:** Minify this JSON to a single line when entering as an environment variable.

## Frontend Configuration

Update `.env` in your frontend:

```bash
# Simli API Key (client-side)
VITE_SIMLI_API_KEY=your_simli_api_key

# LiveKit Configuration
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxx
```

## Deployment Steps

### 1. Deploy RAG Backend First

```bash
# From project root
cd rag-backend

# Test locally
python -m uvicorn app.main:app --reload

# Deploy to Railway
# - Create new service
# - Set root directory: rag-backend
# - Add all environment variables above
# - Deploy
```

### 2. Initial Data Ingestion

After RAG backend deploys, trigger initial ingestion:

```bash
curl -X POST https://your-rag-backend.railway.app/ingest \
  -H "Content-Type: application/json" \
  -d '{"force_update": true}'
```

Or use the admin panel:
```bash
curl -X POST https://your-rag-backend.railway.app/admin/trigger_update
```

### 3. Deploy Worker Services

```bash
# Deploy Tax Worker
# - Root directory: services/worker-tax
# - Add environment variables
# - Deploy

# Deploy Grants Worker
# - Root directory: services/worker-grants
# - Add environment variables (including RAG_BACKEND_URL)
# - Deploy
```

### 4. Verify Deployment

Check each service:

```bash
# Check RAG backend health
curl https://your-rag-backend.railway.app/health

# Check vector store info
curl https://your-rag-backend.railway.app/admin/vector_store_info

# Check update schedule status
curl https://your-rag-backend.railway.app/admin/update_status
```

## Monitoring & Maintenance

### View Update Logs

In Railway, go to the rag-backend service and check logs for:
```
Starting knowledge base update
Collected X entries from [source]
Update completed. New: X, Updated: X, Errors: X
```

### Manual Updates

Trigger a manual update anytime:
```bash
curl -X POST https://your-rag-backend.railway.app/admin/trigger_update
```

### Testing the RAG Pipeline

Test if the knowledge base is working:
```bash
curl -X POST https://your-rag-backend.railway.app/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What art residencies are available in New York?",
    "num_results": 5
  }'
```

## ElevenLabs Voice Setup

### Finding Your Voice IDs

1. Go to https://elevenlabs.io/app/voice-library
2. Select or create voices
3. Copy the voice ID (format: `XxxYyyZzzAaaBbbCcc`)
4. Add to environment variables:
   - Tax Advisor: `ELEVENLABS_VOICE_ID=NaKPQmdr7mMxXuXrNeFC`
   - Grant Expert: `ELEVENLABS_VOICE_ID=OYTbf65OHHFELVut7v2H`

### Voice Recommendations

- **Tax Advisor**: Professional, warm female voice
- **Grant Expert**: Encouraging, friendly voice
- **Model**: Use `eleven_turbo_v2_5` for best latency

## Troubleshooting

### Tax Agent Using Wrong Voice

**Problem:** Still hearing OpenAI voice instead of ElevenLabs
**Solution:**
- Verify `ELEVEN_API_KEY` is set (not `ELEVENLABS_API_KEY`)
- Check Railway logs for "ElevenLabs API key is required"
- Redeploy worker-tax service after setting env vars

### Grant Agent Can't Access Knowledge Base

**Problem:** "I'm having trouble accessing my knowledge base"
**Solution:**
- Check `RAG_BACKEND_URL` uses Railway internal URL
- Format: `http://[service-name].railway.internal:8000`
- Verify rag-backend service is running

### No Updates Running

**Problem:** Knowledge base never updates
**Solution:**
- Check `UPDATE_SCHEDULE` format is valid
- View scheduler status: `/admin/update_status`
- Check Railway logs for scheduler errors
- Try manual trigger: `/admin/trigger_update`

### Web Scraping Fails

**Problem:** Update logs show scraping errors
**Solution:**
- Some sites block scrapers - normal behavior
- RSS feeds are more reliable
- Consider adding API-based sources
- Check `SCRAPING_TIMEOUT` if timeout errors

## Cost Optimization

### OpenAI API Usage

- **Tax Worker**: Uses `gpt-4o` for numeracy
- **Grant Worker**: Uses `gpt-4o` + embeddings for RAG
- **Embeddings**: Only run during updates, not per query

### Update Frequency

Recommended schedules:
- **Development**: `interval:24h` (daily)
- **Production**: `cron:0 0 * * 1` (weekly, Monday midnight)
- **High-churn sites**: `interval:12h` (twice daily)

### Railway Resources

- **Workers**: Keep running (handle real-time conversations)
- **RAG Backend**: Can sleep if no traffic, auto-wakes for updates

## Next Steps

1. **Monitor first update cycle** - Check logs after 24 hours
2. **Review scraped data** - Use `/admin/vector_store_info`
3. **Test avatar responses** - Ask about grants in different locations
4. **Adjust update schedule** - Based on data freshness needs
5. **Add custom sources** - For specific grant databases you know

## Support & Resources

- **LiveKit Docs**: https://docs.livekit.io/agents/
- **Simli Docs**: https://docs.simli.com/
- **ChromaDB Docs**: https://docs.trychroma.com/
- **ElevenLabs**: https://elevenlabs.io/docs/
