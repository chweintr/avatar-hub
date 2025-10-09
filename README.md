# Avatar Hub - AI Avatar Conversation Platform

A web-based platform featuring AI avatars powered by LiveKit agents, OpenAI, and Simli. Specialized agents provide expert advice on taxes for artists and art grants/residencies.

**📖 See [CURRENT_ARCHITECTURE.md](./CURRENT_ARCHITECTURE.md) for complete technical details.**

## Features

- **LiveKit Agents**: Python-based conversational agents deployed on Railway
- **Simli Avatars**: Realistic talking avatar faces with lip sync
- **OpenAI Integration**: GPT-4o + Realtime API for natural conversations
- **RAG-Powered Knowledge**: Grants agent searches database of 124+ funding opportunities
- **Specialized Experts**: Tax advisor and grants expert with domain-specific knowledge

## Quick Start

**Production:** https://avatar-hub-production.up.railway.app/

All services run on Railway. No local development setup needed - everything is deployed.

## Deployment

See [CURRENT_ARCHITECTURE.md](./CURRENT_ARCHITECTURE.md) for complete Railway setup instructions including:
- Required environment variables for each service
- Service configuration (root directories, start commands)
- Troubleshooting guide

## Current Agents

1. **Tax Advisor** - Expert accountant for working artists (taxes, deductions, quarterly estimates)
2. **Grants Expert** - Searches 124+ art grants and residencies database

## Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Backend:** Express.js (token generation)
- **Agents:** Python + LiveKit Agents SDK + OpenAI
- **Avatars:** Simli
- **Voice:** OpenAI Realtime API
- **Database:** ChromaDB (for grants RAG)
- **Deployment:** Railway

## Documentation

- **[CURRENT_ARCHITECTURE.md](./CURRENT_ARCHITECTURE.md)** - Complete technical architecture
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[RAILWAY_FIX_GRANTS.md](./RAILWAY_FIX_GRANTS.md)** - Grants agent setup guide