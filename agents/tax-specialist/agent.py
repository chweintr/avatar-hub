import logging
import os
from typing import Dict, Any

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    WorkerOptions,
    WorkerType,
    cli,
)
from livekit.plugins import openai, simli

logger = logging.getLogger("tax-specialist-agent")
logger.setLevel(logging.INFO)

load_dotenv(override=True)

# Tax specialist knowledge base and instructions
TAX_SPECIALIST_INSTRUCTIONS = """
You are a specialized tax advisor for artists and creative professionals. Your expertise includes:

1. Tax deductions specific to artists (studio space, materials, equipment)
2. Self-employment tax considerations for freelancers
3. Income reporting for various revenue streams (commissions, royalties, grants)
4. Quarterly estimated tax payments
5. Business entity selection (sole proprietorship vs LLC)
6. Record keeping best practices for creative professionals
7. State-specific tax considerations for artists

Always provide practical, actionable advice while reminding users to consult with a licensed tax professional for their specific situation.
Be conversational and supportive, understanding that many artists find taxes overwhelming.
"""

async def entrypoint(ctx: JobContext):
    # Initialize the AI model with tax specialist personality
    session = AgentSession(
        llm=openai.realtime.RealtimeModel(
            voice="alloy",  # Professional but friendly voice
            instructions=TAX_SPECIALIST_INSTRUCTIONS,
            temperature=0.7,  # Balanced creativity and accuracy
        ),
    )

    # Get Simli configuration from environment
    simli_api_key = os.getenv("SIMLI_API_KEY")
    simli_face_id = os.getenv("SIMLI_TAX_SPECIALIST_FACE_ID", os.getenv("SIMLI_FACE_ID"))

    if not simli_api_key:
        logger.error("SIMLI_API_KEY not found in environment variables")
        return

    # Configure the avatar
    simli_avatar = simli.AvatarSession(
        simli_config=simli.SimliConfig(
            api_key=simli_api_key,
            face_id=simli_face_id,
        ),
    )
    
    # Start the avatar session
    await simli_avatar.start(session, room=ctx.room)

    # Create the tax specialist agent
    tax_agent = Agent(
        instructions=TAX_SPECIALIST_INSTRUCTIONS,
        metadata={
            "agent_type": "tax_specialist",
            "specialization": "artist_taxes",
            "version": "1.0"
        }
    )

    # Start the agent session
    await session.start(
        agent=tax_agent,
        room=ctx.room,
    )

    logger.info("Tax specialist agent started successfully")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            worker_type=WorkerType.ROOM,
            name="tax-specialist-agent"
        )
    )