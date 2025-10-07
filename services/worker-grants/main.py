import logging
import os
import httpx
from typing import Optional
from dotenv import load_dotenv
from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, WorkerType, cli, llm
from livekit.plugins import openai, elevenlabs, simli

logger = logging.getLogger("grants-advisor-agent")
logger.setLevel(logging.INFO)

load_dotenv()


class GrantsKnowledgeBase:
    """Interface to RAG backend for grants and residencies"""

    def __init__(self, rag_backend_url: str):
        self.rag_backend_url = rag_backend_url.rstrip('/')
        self.client = httpx.AsyncClient(timeout=30.0)

    async def search_grants(self, query: str, num_results: int = 5) -> str:
        """Search the RAG backend for relevant grants/residencies"""
        try:
            response = await self.client.post(
                f"{self.rag_backend_url}/query",
                json={"query": query, "num_results": num_results, "stream": False}
            )
            response.raise_for_status()
            data = response.json()
            return data.get("response", "I couldn't find specific information about that.")
        except Exception as e:
            logger.error(f"RAG backend error: {e}")
            return "I'm having trouble accessing my knowledge base right now. Please try again."


async def entrypoint(ctx: JobContext):
    """Grant/Residency Expert Avatar - with LiveKit + OpenAI Realtime + Simli

    Using simple instructions for now - RAG integration will come later
    """

    # Use OpenAI Realtime (has built-in STT + LLM + TTS)
    # This is the official Simli pattern - works reliably
    session = AgentSession(
        llm=openai.realtime.RealtimeModel(voice="nova"),
    )

    # Simli avatar configuration
    avatar = simli.AvatarSession(
        simli_config=simli.SimliConfig(
            api_key=os.getenv("SIMLI_API_KEY"),
            face_id=os.getenv("SIMLI_FACE_ID"),
        ),
    )

    # Start avatar
    await avatar.start(session, room=ctx.room)
    logger.info("Simli avatar started")

    # Grant/residency expert instructions
    instructions = """You are an expert advisor on art grants, residencies, and funding opportunities for artists.

Your role is to help artists find and apply for relevant opportunities by searching a comprehensive database.

When a user asks about grants, residencies, or funding:
1. Use the search_art_grants function to find relevant opportunities
2. Summarize the most relevant results clearly and concisely
3. Highlight key information like deadlines, eligibility, funding amounts, and locations
4. Always encourage artists and provide actionable next steps

Be warm, supportive, and specific. Mention actual grant names and organizations when available.
Keep initial responses to 2-3 sentences, but offer more details if asked.

Examples:
- "What grants are available in New York?" → Search for location-based grants
- "I need funding for a sculpture project" → Search for sculpture grants
- "Tell me about residencies with housing" → Search for residencies with accommodation
"""

    # Start the agent session
    await session.start(
        agent=Agent(instructions=instructions),
        room=ctx.room,
    )
    logger.info("Agent session started with RAG-powered grants search")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            worker_type=WorkerType.ROOM
        )
    )
