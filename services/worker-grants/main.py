import logging
import os
import httpx
from typing import Optional
from dotenv import load_dotenv
from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, WorkerType, cli
from livekit.agents.llm import FunctionContext, ai_callable
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
    """Grant/Residency Expert Avatar - RAG-powered with LiveKit + ElevenLabs + Simli

    This agent uses the RAG backend to search a database of art grants and residencies
    """

    await ctx.connect()

    # Initialize RAG backend connection
    rag_url = os.getenv("RAG_BACKEND_URL", "http://localhost:8000")
    knowledge_base = GrantsKnowledgeBase(rag_url)

    # Define function tool for grant search
    @ai_callable()
    async def search_art_grants(
        query: str,
        num_results: int = 5
    ) -> str:
        """
        Search the art grants and residencies knowledge base for relevant opportunities.
        Use this function whenever the user asks about grants, residencies, funding, or opportunities.

        Args:
            query: The search query based on user's question
            num_results: Number of results to return (default 5)
        """
        logger.info(f"Searching grants with query: {query}")
        result = await knowledge_base.search_grants(query, num_results)
        logger.info(f"Search result: {result[:200]}...")
        return result

    # Create function context
    func_ctx = FunctionContext()
    func_ctx.ai_callable(search_art_grants)

    # Use OpenAI LLM with ElevenLabs TTS
    session = AgentSession(
        llm=openai.LLM(model="gpt-4o"),
        tts=elevenlabs.TTS(
            voice_id=os.getenv("ELEVENLABS_VOICE_ID", "OYTbf65OHHFELVut7v2H"),
            api_key=os.getenv("ELEVEN_API_KEY"),
            model="eleven_turbo_v2_5"
        ),
        functions=[func_ctx],
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
