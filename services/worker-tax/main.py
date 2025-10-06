import logging
import os
from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, WorkerType, cli
from livekit.plugins import openai, simli

logging.basicConfig(level=logging.INFO)


async def entrypoint(ctx: JobContext):
    """Tax Advisor Avatar - LiveKit + OpenAI Realtime + Simli

    Flow: User mic → OpenAI Realtime (STT+LLM+TTS) → Simli (lip-sync) → User sees/hears avatar
    """

    # OpenAI Realtime: handles STT + LLM + TTS in one session
    session = AgentSession(
        llm=openai.realtime.RealtimeModel(
            voice="alloy",
            instructions="You are a knowledgeable tax advisor specializing in helping artists, creatives, and freelancers. Provide clear, practical tax advice. Be conversational and friendly. Keep responses concise (2-3 sentences) unless asked for details.",
        )
    )

    # Simli avatar: receives ONLY the agent's synthesized audio for lip-sync
    simli_avatar = simli.AvatarSession(
        simli_config=simli.SimliConfig(
            api_key=os.environ["SIMLI_API_KEY"],
            face_id=os.environ["SIMLI_FACE_ID"],
        ),
    )

    # Start Simli avatar with the agent session
    await simli_avatar.start(session, room=ctx.room)

    # Start the agent session in the room
    await session.start(
        agent=Agent(),
        room=ctx.room,
    )


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            worker_type=WorkerType.ROOM
        )
    )
