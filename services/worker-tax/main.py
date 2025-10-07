import logging
import os
from dotenv import load_dotenv
from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, WorkerType, cli
from livekit.plugins import openai, simli

logger = logging.getLogger("tax-advisor-agent")
logger.setLevel(logging.INFO)

load_dotenv()


async def entrypoint(ctx: JobContext):
    """Tax Advisor Avatar - LiveKit + OpenAI + ElevenLabs + Simli

    Per official Simli docs: https://docs.livekit.io/agents/plugins/simli/
    The plugin handles avatar participant creation and A/V publishing automatically.
    """

    await ctx.connect()

    # OpenAI Realtime handles STT + LLM + TTS with built-in voices
    # Available voices: alloy, ash, ballad, coral, echo, sage, shimmer, verse
    session = AgentSession(
        llm=openai.realtime.RealtimeModel(
            voice=os.getenv("OPENAI_VOICE", "sage")  # Default to 'sage' (calm, thoughtful)
        ),
    )

    # Simli avatar configuration
    avatar = simli.AvatarSession(
        simli_config=simli.SimliConfig(
            api_key=os.getenv("SIMLI_API_KEY"),
            face_id=os.getenv("SIMLI_FACE_ID"),
        ),
    )

    # Start avatar - plugin handles LiveKit credentials internally via ctx.room
    await avatar.start(session, room=ctx.room)
    logger.info("Simli avatar started")

    # Start the agent session
    await session.start(
        agent=Agent(instructions="You are a knowledgeable tax advisor specializing in helping artists, creatives, and freelancers. Provide clear, practical tax advice. Be conversational and friendly. Keep responses concise (2-3 sentences) unless asked for details."),
        room=ctx.room,
    )
    logger.info("Agent session started")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            worker_type=WorkerType.ROOM
        )
    )
