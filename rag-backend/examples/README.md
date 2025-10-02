# RAG Backend Examples

This directory contains example implementations for integrating with the RAG backend.

## Files

### simli_client.html
A complete web-based example showing how to:
- Connect to the RAG backend via WebSocket
- Initialize a Simli avatar
- Send queries and receive expert responses
- Display retrieved context and avatar speech

**Usage:**
1. Open the file in a web browser
2. Enter your Simli API key
3. Update the backend URL if not running locally
4. Click "Connect Avatar"
5. Ask questions about art grants and residencies

### test_client.py
A Python CLI client for testing all API endpoints:
- Health checks
- Knowledge base ingestion
- Context retrieval
- Query processing
- Interactive WebSocket session

**Usage:**
```bash
# Install dependencies
pip install httpx websockets

# Run the test client
python test_client.py

# Or make it executable
chmod +x test_client.py
./test_client.py
```

## Integration Examples

### Basic HTTP Query
```python
import requests

response = requests.post(
    "http://localhost:8000/query",
    json={"query": "What grants are available for digital artists?"}
)
print(response.json()["response"])
```

### WebSocket Real-time
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/simli');

ws.onopen = () => {
    ws.send(JSON.stringify({
        type: 'query',
        content: 'Tell me about European artist residencies'
    }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'response') {
        console.log('Expert says:', data.text);
        // Send to avatar for speech
        simliClient.sendText(data.text);
    }
};
```

### Streaming Response
```python
import httpx
import json

async def stream_query(query: str):
    async with httpx.AsyncClient() as client:
        async with client.stream(
            "POST",
            "http://localhost:8000/query",
            json={"query": query, "stream": True}
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    chunk = json.loads(line[6:])
                    print(chunk["text"], end="", flush=True)
```

## Avatar Integration Notes

1. **Simli Avatar**: The example uses avatar ID `d951e6dc-c098-43fb-a34f-e970cd339ea6`
2. **HeyGen Alternative**: Replace the Simli client initialization with HeyGen SDK
3. **Custom Avatars**: Update the avatar ID in the HTML example

## Testing Workflow

1. Start the RAG backend:
   ```bash
   cd ../
   uvicorn app.main:app --reload
   ```

2. Ingest knowledge base:
   ```bash
   curl -X POST http://localhost:8000/ingest
   ```

3. Test with the Python client:
   ```bash
   python examples/test_client.py
   ```

4. Test with the web interface:
   - Open `simli_client.html` in your browser
   - Connect and interact with the avatar