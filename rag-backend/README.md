# RAG Backend for Art Grants & Residency Expert

A sophisticated Python-based Retrieval-Augmented Generation (RAG) backend for an art grants and residency expert avatar.

## Features

- **Vector Database Integration**: ChromaDB for efficient semantic search
- **Data Ingestion**: Process JSON knowledge base into vector embeddings
- **Semantic Search**: Advanced retrieval with query enhancement and reranking
- **LLM Integration**: GPT-4o for contextual response generation
- **Real-time Communication**: WebSocket support for avatar orchestration
- **Railway Deployment**: Production-ready configuration

## Architecture

```
rag-backend/
├── app/
│   ├── __init__.py
│   └── main.py          # FastAPI application
├── services/
│   ├── __init__.py
│   ├── vector_store.py  # ChromaDB integration
│   ├── retrieval.py     # Search & reranking
│   ├── llm_service.py   # GPT-4o integration
│   └── simli_orchestrator.py  # Avatar orchestration
├── models/
│   ├── __init__.py
│   └── schemas.py       # Pydantic models
├── utils/
│   ├── __init__.py
│   └── config.py        # Configuration management
├── data/                # Knowledge base storage
├── Dockerfile
├── requirements.txt
├── railway.json
└── .env.example
```

## Local Development

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd avatar-hub/rag-backend
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**:
   ```bash
   uvicorn app.main:app --reload
   ```

## Railway Deployment

1. **Create a new Railway project**:
   - Go to [Railway](https://railway.app)
   - Create a new project
   - Connect your GitHub repository

2. **Configure environment variables**:
   Add these variables in Railway dashboard:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `CHROMA_PERSIST_DIRECTORY`: `/app/chroma_db`
   - `CHROMA_COLLECTION_NAME`: `art_grants_knowledge`
   - `LLM_MODEL`: `gpt-4o`
   - `KNOWLEDGE_BASE_PATH`: `/app/data/art_grants_residencies_kb.json`

3. **Deploy**:
   - Railway will automatically detect the Dockerfile
   - The service will build and deploy
   - Access your API at the provided Railway URL

## API Endpoints

- `GET /health`: Health check endpoint
- `POST /ingest`: Ingest knowledge base into vector store
- `POST /retrieve_context`: Retrieve relevant context chunks
- `POST /query`: Generate expert responses with RAG
- `WS /ws/simli`: WebSocket for real-time avatar communication

## Data Ingestion

Place your `art_grants_residencies_kb.json` in the `data/` directory and call:

```bash
curl -X POST https://your-railway-url.railway.app/ingest
```

## Example Usage

```python
import requests

# Query the expert
response = requests.post(
    "https://your-railway-url.railway.app/query",
    json={"query": "What are the best artist residencies in Europe?"}
)

print(response.json())
```

## WebSocket Integration

```javascript
const ws = new WebSocket('wss://your-railway-url.railway.app/ws/simli');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Expert response:', data);
};

ws.send(JSON.stringify({
    type: 'query',
    content: 'Tell me about grants for emerging artists'
}));
```

## Environment Variables

See `.env.example` for all available configuration options.

## Monitoring

- Check health: `/health`
- Logs: Available in Railway dashboard
- Metrics: Response times and confidence scores in API responses