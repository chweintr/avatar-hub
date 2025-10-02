# RAG Backend Deployment Guide

## Step 1: Prepare Your Repository

First, let's make sure your code is ready:

```bash
cd "/Volumes/T7/Avatars on Black/avatar-hub/rag-backend"

# Initialize git if needed
git init
git add .
git commit -m "Initial RAG backend for art grants expert"
```

## Step 2: Create Railway Project

1. Go to https://railway.app
2. Click "New Project"
3. Choose "Deploy from GitHub repo" 
4. Connect your GitHub account if needed
5. Select your repository

## Step 3: Configure Environment Variables

In Railway dashboard, go to your service and click "Variables". Add these:

```
OPENAI_API_KEY=sk-your-actual-openai-key-here
CHROMA_PERSIST_DIRECTORY=/app/chroma_db
CHROMA_COLLECTION_NAME=art_grants_knowledge
LLM_MODEL=gpt-4o
LLM_MAX_TOKENS=1000
LLM_TEMPERATURE=0.7
CHUNK_SIZE=500
CHUNK_OVERLAP=50
TOP_K_RESULTS=5
KNOWLEDGE_BASE_PATH=/app/data/art_grants_residencies_kb.json
CORS_ORIGINS=https://your-frontend.railway.app,http://localhost:3000
```

## Step 4: Deploy Using Railway CLI

If you have Railway CLI installed:

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Deploy
railway up
```

## Step 5: After Deployment - Ingest Data

Once deployed, you need to populate the vector database:

```bash
# Get your Railway URL (will look like: https://your-app.railway.app)
railway open

# Ingest the knowledge base
curl -X POST https://your-rag-backend.railway.app/ingest
```

## Step 6: Test Your Deployment

Test the API:

```bash
# Health check
curl https://your-rag-backend.railway.app/health

# Test a query
curl -X POST https://your-rag-backend.railway.app/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the best artist residencies in Europe?"}'
```

## What Each Step Does:

- **Step 3**: The environment variables tell your app:
  - Which OpenAI key to use for embeddings and GPT-4o
  - Where to store the vector database
  - How to chunk the text (500 chars with 50 char overlap)
  - How many results to return (top 5)

- **Step 4**: Deploys your Docker container to Railway's infrastructure

- **Step 5**: The `/ingest` endpoint reads your JSON file and creates embeddings in ChromaDB

## Common Issues:

1. **Build fails**: Check Railway logs for errors
2. **Ingest times out**: The knowledge base might be large. Wait a few minutes
3. **Queries return empty**: Make sure you ran the ingest endpoint first

## Next Steps:

1. Update the CORS_ORIGINS to include your Avatar Hub frontend URL
2. Test with the example client at `/examples/simli_client.html`
3. Monitor usage in Railway dashboard