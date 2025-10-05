import asyncio
import os
from livekit import agents, rtc
from livekit.plugins import simli

async def entrypoint(ctx: agents.JobContext):
    # Configuration from environment
    room_name = os.getenv("LIVEKIT_ROOM", "avatar-tax")
    face_id = os.getenv("FACE_ID_1")
    agent_id = os.getenv("SIMLI_AGENT_ID_TAX")
    simli_api_key = os.getenv("SIMLI_API_KEY")

    # Connect to LiveKit room
    await ctx.connect()

    # Initialize Simli avatar
    avatar = simli.Avatar(
        api_key=simli_api_key,
        face_id=face_id,
        agent_id=agent_id
    )

    # Set up audio/video tracks
    audio_source = rtc.AudioSource(sample_rate=16000, num_channels=1)
    video_source = rtc.VideoSource(width=512, height=512)

    audio_track = rtc.LocalAudioTrack.create_audio_track("avatar-audio", audio_source)
    video_track = rtc.LocalVideoTrack.create_video_track("avatar-video", video_source)

    # Publish tracks to room
    await ctx.room.local_participant.publish_track(audio_track)
    await ctx.room.local_participant.publish_track(video_track)

    # Listen for user audio
    @ctx.room.on("track_subscribed")
    def on_track_subscribed(track: rtc.Track, publication: rtc.TrackPublication, participant: rtc.RemoteParticipant):
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            asyncio.create_task(handle_user_audio(track, avatar, audio_source, video_source))

    # Keep running
    await asyncio.Future()

async def handle_user_audio(track: rtc.Track, avatar, audio_source, video_source):
    """Process user audio through Simli avatar"""
    audio_stream = rtc.AudioStream(track)

    async for frame in audio_stream:
        # Send user audio to Simli
        response = await avatar.process_audio(frame)

        # Push Simli's audio response to LiveKit
        if response.audio:
            await audio_source.capture_frame(response.audio)

        # Push Simli's video response to LiveKit
        if response.video:
            await video_source.capture_frame(response.video)

if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
