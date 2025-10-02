#!/bin/bash

# Railway Deployment Script for RAG Backend

echo "🚀 Deploying RAG Backend to Railway..."

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Please run:"
    echo "   railway login"
    exit 1
fi

# Create data directory if it doesn't exist
mkdir -p data

# Check if knowledge base file exists
if [ ! -f "data/art_grants_residencies_kb.json" ]; then
    echo "⚠️  Warning: data/art_grants_residencies_kb.json not found"
    echo "   Please add your knowledge base file before ingesting data"
fi

# Deploy to Railway
echo "📦 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Set environment variables in Railway dashboard"
echo "2. Add your knowledge base file to data/"
echo "3. Call the /ingest endpoint to populate the vector database"
echo ""
echo "Example ingest command:"
echo "curl -X POST https://your-app.railway.app/ingest"