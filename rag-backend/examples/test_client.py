#!/usr/bin/env python3
"""
Test client for RAG Backend API
"""

import asyncio
import json
import httpx
import websockets
from typing import Optional

class RAGBackendClient:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.ws_url = base_url.replace("http", "ws") + "/ws/simli"
    
    async def health_check(self):
        """Check if the backend is healthy"""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/health")
            return response.json()
    
    async def ingest_knowledge_base(self):
        """Trigger knowledge base ingestion"""
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(f"{self.base_url}/ingest")
            return response.json()
    
    async def retrieve_context(self, query: str, top_k: int = 5):
        """Retrieve relevant context for a query"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/retrieve_context",
                json={"query": query, "top_k": top_k}
            )
            return response.json()
    
    async def query(self, query: str, stream: bool = False):
        """Send a query and get expert response"""
        async with httpx.AsyncClient(timeout=60.0) as client:
            if stream:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/query",
                    json={"query": query, "stream": True}
                ) as response:
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            yield json.loads(line[6:])
            else:
                response = await client.post(
                    f"{self.base_url}/query",
                    json={"query": query, "stream": False}
                )
                yield response.json()
    
    async def websocket_session(self):
        """Interactive WebSocket session"""
        async with websockets.connect(self.ws_url) as websocket:
            print("Connected to WebSocket. Type 'exit' to quit.")
            
            # Start listener task
            async def listen():
                try:
                    async for message in websocket:
                        data = json.loads(message)
                        print(f"\n[{data['type'].upper()}]: ", end="")
                        
                        if data['type'] == 'context':
                            print(f"Found {len(data['chunks'])} relevant chunks")
                            for i, chunk in enumerate(data['chunks'][:2]):
                                print(f"  {i+1}. {chunk['source']}: {chunk['text'][:100]}...")
                        
                        elif data['type'] == 'response':
                            print(f"\n{data['text']}")
                            if 'confidence' in data:
                                print(f"\nConfidence: {data['confidence']:.2f}")
                        
                        elif data['type'] == 'error':
                            print(f"Error: {data['message']}")
                        
                        else:
                            print(data.get('message', json.dumps(data)))
                            
                except websockets.exceptions.ConnectionClosed:
                    print("\nConnection closed")
            
            # Start listener
            listen_task = asyncio.create_task(listen())
            
            # Send queries
            try:
                while True:
                    query = input("\nYour question: ")
                    if query.lower() == 'exit':
                        break
                    
                    await websocket.send(json.dumps({
                        "type": "query",
                        "content": query
                    }))
                    
                    # Wait a bit for response
                    await asyncio.sleep(0.1)
                    
            except KeyboardInterrupt:
                print("\nExiting...")
            
            finally:
                listen_task.cancel()

async def main():
    client = RAGBackendClient()
    
    print("RAG Backend Test Client")
    print("=" * 50)
    
    # Health check
    print("\n1. Health Check:")
    health = await client.health_check()
    print(f"   Status: {health['status']}")
    print(f"   Services: {', '.join([s for s, ok in health['services'].items() if ok])}")
    
    # Ask if user wants to ingest data
    ingest = input("\n2. Ingest knowledge base? (y/n): ")
    if ingest.lower() == 'y':
        print("   Ingesting... (this may take a few minutes)")
        result = await client.ingest_knowledge_base()
        print(f"   Result: {result['message']}")
        if 'documents_processed' in result:
            print(f"   Documents: {result['documents_processed']}")
    
    # Test queries
    print("\n3. Test Queries:")
    test_queries = [
        "What are the best artist residencies in Europe?",
        "How do I write a strong grant proposal?",
        "What funding is available for emerging artists?"
    ]
    
    for query in test_queries:
        print(f"\n   Q: {query}")
        
        # Get context
        context_result = await client.retrieve_context(query, top_k=3)
        print(f"   Context: Found {len(context_result['chunks'])} relevant chunks")
        
        # Get response
        response_parts = []
        async for response in client.query(query, stream=False):
            response_parts.append(response)
        
        if response_parts:
            result = response_parts[0]
            print(f"   A: {result['response'][:200]}...")
            print(f"   Confidence: {result.get('confidence', 0):.2f}")
    
    # Interactive session
    print("\n4. Interactive WebSocket Session")
    interactive = input("   Start interactive session? (y/n): ")
    if interactive.lower() == 'y':
        await client.websocket_session()
    
    print("\nTest complete!")

if __name__ == "__main__":
    asyncio.run(main())