import os
import asyncio
import logging
from livekit import rtc, api as lk_api
from livekit.agents import Agent, AgentSession
from livekit.plugins import openai, simli

logging.basicConfig(level=logging.INFO)


async def main():
    """Tax Advisor Avatar - LiveKit + OpenAI Realtime + Simli

    Self-join worker: connects to LiveKit room and publishes avatar A/V
    """
    url = os.environ["LIVEKIT_URL"]
    room_name = os.getenv("LIVEKIT_ROOM", "avatar-tax")

    # Create access token for worker
    at = lk_api.AccessToken(
        os.environ["LIVEKIT_API_KEY"],
        os.environ["LIVEKIT_API_SECRET"],
        identity=f"{room_name}-simli-worker",
        name="Simli Worker"
    )
    at.add_grant(lk_api.VideoGrant(
        room_join=True,
        room=room_name,
        can_publish=True,
        can_subscribe=True
    ))
    token = at.to_jwt()

    # Connect to room
    room = rtc.Room()
    await room.connect(url, token)
    logging.info(f"Joined LiveKit room: {room_name}")

    # OpenAI Realtime session
    session = AgentSession(
        llm=openai.realtime.RealtimeModel(voice="alloy")
    )

    # Simli avatar
    avatar = simli.AvatarSession(
        simli.SimliConfig(
            api_key=os.environ["SIMLI_API_KEY"],
            face_id=os.environ["SIMLI_FACE_ID"],
            agent_id=os.getenv("SIMLI_AGENT_ID") or None,
        )
    )

    # Start avatar and session
    await avatar.start(session, room=room)
    await session.start(
        agent=Agent(instructions="Tax advisor for artists. Be concise and practical."),
        room=room
    )

    # Keep running
    await asyncio.Event().wait()


if __name__ == "__main__":
    asyncio.run(main())
