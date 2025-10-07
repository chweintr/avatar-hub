import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, RemoteTrackPublication } from "livekit-client";

export default function StageLiveKit({ roomName }: { roomName: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Idle");
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => () => { room?.disconnect(); }, [room]);

  async function connect() {
    try {
      setStatus("Fetching token…");
      const user = crypto.randomUUID();
      const r = await fetch(`/api/livekit-token?room=${encodeURIComponent(roomName)}&user=${user}`);
      if (!r.ok) { setStatus("Token 500"); return; }
      const { url, token } = await r.json();

      const lkRoom = new Room({ adaptiveStream: true, dynacast: true });

      // Subscribe to avatar's video track
      lkRoom.on(RoomEvent.TrackSubscribed, (_track, pub: RemoteTrackPublication, participant) => {
        console.log("[livekit] track subscribed:", pub.kind, "from", participant.identity);
        if (pub.kind === "video" && videoRef.current) {
          pub.videoTrack?.attach(videoRef.current);
          setStatus(`Watching ${participant.name || participant.identity}`);
        }
      });

      setStatus("Joining…");
      await lkRoom.connect(url, token);

      // Disable camera (visuals come from Simli avatar)
      await lkRoom.localParticipant.setCameraEnabled(false);

      // Enable microphone (you speak to the agent)
      await lkRoom.localParticipant.setMicrophoneEnabled(true);

      setRoom(lkRoom);
      setStatus("Connected");
      console.log("[livekit] connected to room:", roomName);
    } catch (e: any) {
      console.error("[livekit] connect error:", e);
      setStatus("Error: " + (e?.message || String(e)));
    }
  }

  return (
    <div className="relative mx-auto" style={{ width: "min(58vmin, 640px)", height: "min(58vmin, 640px)" }}>
      <div className="absolute inset-0 rounded-full overflow-hidden bg-black">
        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
      </div>
      <div className="absolute inset-0 rounded-full ring-2 ring-white/85 pointer-events-none" />
      <button
        onClick={connect}
        className="absolute z-50 left-1/2 -translate-x-1/2 bottom-6 rounded-full bg-white text-black px-5 py-2.5 text-sm shadow"
      >
        Connect
      </button>
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[11px] text-white/70">{status}</div>
    </div>
  );
}
