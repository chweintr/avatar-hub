import logging
import os
import httpx
from dotenv import load_dotenv
from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, WorkerType, cli, RunContext
from livekit.agents.llm import function_tool
from livekit.plugins import openai, silero, simli

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


# Global knowledge base instance
knowledge_base = None


class GrantsAgent(Agent):
    """Grant/Residency Expert Agent with RAG capabilities"""

    def __init__(self):
        super().__init__(
            instructions="""You are an expert advisor on art grants, residencies, and funding opportunities for artists.

Your role is to help artists find and apply for relevant opportunities by searching a comprehensive database.

When a user asks about grants, residencies, or funding:
1. Use the search_art_grants function to find relevant opportunities
2. Summarize the most relevant results clearly and concisely
3. Highlight key information like deadlines, eligibility, funding amounts, and locations
4. Always encourage artists and provide actionable next steps

Be warm, supportive, and specific. Mention actual grant names and organizations when available.
Keep initial responses to 2-3 sentences, but offer more details if asked."""
        )

    @function_tool
    async def search_art_grants(
        self,
        context: RunContext,
        query: str,
    ) -> str:
        """Search the art grants and residencies knowledge base for relevant opportunities.
        Use this function whenever the user asks about grants, residencies, funding, or opportunities.

        Args:
            query: The search query based on user's question (e.g., "residencies in New York", "sculpture grants")
        """
        logger.info(f"Searching grants with query: {query}")

        if knowledge_base:
            result = await knowledge_base.search_grants(query, num_results=5)
            logger.info(f"Search result: {result[:200]}...")
            return result
        else:
            return "Knowledge base not initialized. Please try again."


async def entrypoint(ctx: JobContext):
    """Grant/Residency Expert Avatar - RAG-powered with Deepgram STT + OpenAI LLM + Simli"""

    global knowledge_base

    # Initialize RAG backend connection
    rag_url = os.getenv("RAG_BACKEND_URL", "http://localhost:8000")
    knowledge_base = GrantsKnowledgeBase(rag_url)

    # Use OpenAI STT + LLM + TTS (supports function calling!)
    # Using OpenAI for everything - simpler, one API key
    session = AgentSession(
        vad=silero.VAD.load(),
        stt=openai.STT(language="en"),  # Force English!
        llm=openai.LLM(model="gpt-4o"),
        tts=openai.TTS(voice="nova"),
    )

    # Simli avatar configuration - use GRANTS specific face ID
    avatar = simli.AvatarSession(
        simli_config=simli.SimliConfig(
            api_key=os.getenv("SIMLI_API_KEY"),
            face_id=os.getenv("SIMLI_GRANTS_FACE_ID") or os.getenv("SIMLI_FACE_ID"),  # Fallback to generic
        ),
    )

    # Start avatar
    await avatar.start(session, room=ctx.room)
    logger.info("Simli avatar started")

    # Start the agent session with GrantsAgent (has function tools)
    await session.start(
        agent=GrantsAgent(),
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
