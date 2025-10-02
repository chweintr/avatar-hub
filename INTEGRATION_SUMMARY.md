# Avatar Hub Integration Summary

## What We Built

The Art Grants/Residency Expert is now fully integrated into your Avatar Hub (Caleb's Club) as one of the avatar options. Here's how it works:

### Architecture
```
Avatar Hub (React) 
    ↓
Express Backend (Port 3001)
    ↓
RAG Backend (Port 8000) - Only for Grants Avatar
    ↓
ChromaDB (Vector Store with Art Grants Knowledge)
```

## The Grant Expert Avatar

- **Face ID**: `cace3ef7-a4c4-425d-a8cf-a5358eb0c427` (as you specified)
- **Powered by**: RAG (Retrieval Augmented Generation) with GPT-4o
- **Knowledge Base**: Automatically updated daily with latest grants/residencies
- **Special Features**: 
  - Searches through curated database of opportunities
  - Provides specific deadlines and requirements
  - Gives application tips and eligibility criteria

## Running Everything Together

### Option 1: Simple Start Script
```bash
./start-all.sh
```
This starts all three services (Frontend, Express Backend, RAG Backend)

### Option 2: Docker Compose
```bash
docker-compose up
```

### Option 3: Manual Start
```bash
# Terminal 1 - RAG Backend
cd rag-backend && uvicorn app.main:app --port 8000

# Terminal 2 - Express Backend  
npm run server

# Terminal 3 - Frontend
npm run dev
```

## First Time Setup

1. Set environment variables in `.env`:
```env
OPENAI_API_KEY=sk-your-key
SIMLI_API_KEY=your-simli-key
```

2. Ingest the knowledge base:
```bash
curl -X POST http://localhost:8000/ingest
```

## How Users Experience It

1. User goes to Avatar Hub (Caleb's Club)
2. Sees 4 avatar options including "Grant / Residency Expert"
3. Clicks on the Grant Expert
4. Avatar loads with face `cace3ef7-a4c4-425d-a8cf-a5358eb0c427`
5. User asks questions like:
   - "What artist residencies are available in Berlin?"
   - "How do I apply for NEA grants?"
   - "What funding is available for emerging digital artists?"
6. Avatar provides expert answers based on the RAG knowledge base

## Railway Deployment

Deploy as a single project with 3 services:

1. **frontend** - The React Avatar Hub
2. **backend** - Express API server
3. **rag-backend** - Python RAG service

The services communicate internally on Railway using private domains.

## Key Files Created/Modified

- `/server/index.ts` - Added grants avatar config and RAG proxy endpoints
- `/src/config/avatars.ts` - Updated grants avatar to use RAG integration
- `/public/simli-rag-agent.html` - New unified avatar agent with RAG support
- `/rag-backend/*` - Complete RAG backend with automated updates
- `/docker-compose.yml` - Run everything together
- `/start-all.sh` - Simple startup script

## Automated Knowledge Updates

The RAG backend automatically:
- Scrapes art residency websites daily
- Updates the knowledge base with new opportunities
- Removes expired deadlines
- Deduplicates entries across sources

Configure update schedule with `UPDATE_SCHEDULE` env var.

## Next Steps

1. Deploy to Railway following `/docs/UNIFIED_DEPLOYMENT.md`
2. Add thumbnail images for avatars in `/public/thumbs/`
3. Customize the data sources for specific regions/disciplines
4. Test with real users!

The Grant/Residency Expert is now a fully integrated avatar in your Avatar Hub, not a separate site!