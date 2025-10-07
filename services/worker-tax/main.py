import logging
import os
from dotenv import load_dotenv
from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, WorkerType, cli
from livekit.plugins import openai, elevenlabs, simli

logger = logging.getLogger("tax-advisor-agent")
logger.setLevel(logging.INFO)

load_dotenv()


async def entrypoint(ctx: JobContext):
    """Tax Advisor Avatar - LiveKit + OpenAI + ElevenLabs + Simli

    Per official Simli docs: https://docs.livekit.io/agents/plugins/simli/
    The plugin handles avatar participant creation and A/V publishing automatically.
    """

    await ctx.connect()

    # Debug: Check ElevenLabs environment variables
    voice_id = os.getenv("ELEVENLABS_VOICE_ID")
    api_key = os.getenv("ELEVEN_API_KEY")

    logger.info(f"ELEVENLABS_VOICE_ID present: {voice_id is not None}")
    logger.info(f"ELEVEN_API_KEY present: {api_key is not None}")

    if not voice_id:
        raise ValueError("ELEVENLABS_VOICE_ID environment variable is required")
    if not api_key:
        raise ValueError("ELEVEN_API_KEY environment variable is required")

    # Use ElevenLabs for TTS
    session = AgentSession(
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=elevenlabs.TTS(
            voice_id=voice_id,
            api_key=api_key
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
