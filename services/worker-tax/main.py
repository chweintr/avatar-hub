import os
from dotenv import load_dotenv
from loguru import logger
from simli import SimliConfig

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.services.elevenlabs import ElevenLabsTTSService
from pipecat.services.openai import OpenAILLMService
from pipecat.services.simli.video import SimliVideoService
from pipecat.transports.services.daily import DailyParams, DailyTransport

load_dotenv(override=True)


async def main():
    """Tax Advisor Avatar - Uses ONLY OpenAI + ElevenLabs + Simli"""

    # Daily.co WebRTC transport (free tier for rooms)
    transport = DailyTransport(
        os.getenv("DAILY_ROOM_URL"),
        os.getenv("DAILY_TOKEN"),
        "Tax Advisor Bot",
        DailyParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            video_out_enabled=True,
            video_out_is_live=True,
            video_out_width=512,
            video_out_height=512,
            vad_analyzer=SileroVADAnalyzer(),
            transcription_enabled=True,  # OpenAI Whisper for STT
        ),
    )

    # Text-to-Speech via ElevenLabs (you already have API key)
    tts = ElevenLabsTTSService(
        api_key=os.getenv("ELEVENLABS_API_KEY"),
        voice_id=os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM"),  # Default voice
    )

    # Simli Avatar (lip-sync from ElevenLabs audio)
    simli_service = SimliVideoService(
        SimliConfig(
            os.getenv("SIMLI_API_KEY"),
            os.getenv("SIMLI_FACE_ID")
        ),
    )

    # LLM via OpenAI (you already have API key)
    llm = OpenAILLMService(
        api_key=os.getenv("OPENAI_API_KEY"),
        model="gpt-4o-mini"
    )

    # System prompt for tax advisor
    messages = [
        {
            "role": "system",
            "content": """You are a knowledgeable tax advisor specializing in helping artists, creatives, and freelancers.
Provide clear, practical tax advice. Be conversational and friendly.
Keep responses concise (2-3 sentences) unless asked for details."""
        },
    ]

    context = OpenAILLMContext(messages)
    context_aggregator = llm.create_context_aggregator(context)

    # Pipeline: User Audio → OpenAI Whisper (STT) → LLM → ElevenLabs (TTS) → Simli
    pipeline = Pipeline(
        [
            transport.input(),           # User microphone
            # STT handled by Daily transcription (OpenAI Whisper)
            context_aggregator.user(),   # Add to conversation
            llm,                          # Generate response
            tts,                          # ElevenLabs synthesizes speech
            simli_service,                # Simli lip-syncs to TTS audio (NOT mic!)
            transport.output(),           # Send avatar video/audio to user
            context_aggregator.assistant(),
        ]
    )

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
    )

    @transport.event_handler("on_first_participant_joined")
    async def on_first_participant_joined(transport, participant):
        logger.info(f"First participant joined: {participant['id']}")
        await transport.capture_participant_transcription(participant["id"])
        await task.queue_frames([context_aggregator.user().get_context_frame()])

    @transport.event_handler("on_participant_left")
    async def on_participant_left(transport, participant, reason):
        logger.info(f"Participant left: {participant['id']}")
        await task.cancel()

    @transport.event_handler("on_call_state_updated")
    async def on_call_state_updated(transport, state):
        logger.info(f"Call state: {state}")

    runner = PipelineRunner()
    await runner.run(task)


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
