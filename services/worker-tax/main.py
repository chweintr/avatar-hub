import os
from dotenv import load_dotenv
from loguru import logger
from simli import SimliConfig

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.services.simli.video import SimliVideoService
from pipecat.transports.base_transport import TransportParams
from pipecat.transports.services.daily import DailyParams, DailyTransport

load_dotenv(override=True)


async def main():
    """Tax Advisor Avatar - Pipecat + Simli Pipeline"""

    # Daily.co room configuration (for WebRTC only, not Daily Bots)
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
        ),
    )

    # Speech-to-Text
    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))

    # Text-to-Speech
    tts = CartesiaTTSService(
        api_key=os.getenv("CARTESIA_API_KEY"),
        voice_id=os.getenv("CARTESIA_VOICE_ID", "79a125e8-cd45-4c13-8a67-188112f4dd22"),
    )

    # Simli Avatar (lip-sync from TTS audio)
    simli_service = SimliVideoService(
        SimliConfig(
            os.getenv("SIMLI_API_KEY"),
            os.getenv("SIMLI_FACE_ID")
        ),
    )

    # Large Language Model
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

    # Pipeline: User Audio → STT → LLM → TTS → Simli (bot audio only!)
    pipeline = Pipeline(
        [
            transport.input(),           # User microphone
            stt,                          # Speech to text
            context_aggregator.user(),   # Add to conversation
            llm,                          # Generate response
            tts,                          # Synthesize speech
            simli_service,                # Lip-sync avatar (receives TTS audio, NOT mic!)
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
