import { useEffect, useRef, useState } from "react";
import { Room, RemoteParticipant, createLocalTracks } from "livekit-client";

export default function StageLiveKit({ roomName }: { roomName: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [status, setStatus] = useState<"Ready"|"Connecting"|"Connected"|"Error">("Ready");
  const [room, setRoom] = useState<Room | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => () => { room?.disconnect(); }, [room]);

  async function connect() {
    if (connecting) return;
    setConnecting(true);
    try {
      setStatus("Connecting");
      const me = crypto.randomUUID();
      const apiBase = import.meta.env.VITE_API_BASE || '';
      const resp = await fetch(`${apiBase}/api/livekit-token?room=avatar-tax&user=${me}`);
      if (!resp.ok) throw new Error("token http " + resp.status);
      const { url, token } = await resp.json();

      const r = new Room();
      await r.connect(url, token);

      // publish your mic to the room (echo-cancelled). Not played locally.
      const [mic] = await createLocalTracks({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      await r.localParticipant.publishTrack(mic);

      // subscribe to the avatar's remote tracks
      r.on("trackSubscribed", (track, _pub, participant: RemoteParticipant) => {
        if (track.kind === "video" && videoRef.current) track.attach(videoRef.current);
        if (track.kind === "audio" && audioRef.current) track.attach(audioRef.current);
      });

      setRoom(r);
      setStatus("Connected");
    } catch (e) {
      console.error(e);
      setStatus("Error");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="relative mx-auto" style={{ width: "min(58vmin, 640px)", height: "min(58vmin, 640px)" }}>
      <div className="absolute inset-0 rounded-full overflow-hidden bg-black">
        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
        <audio ref={audioRef} autoPlay playsInline />
      </div>
      <div className="absolute inset-0 rounded-full ring-2 ring-white/85 pointer-events-none" />
      {status !== "Connected" && (
        <button
          onClick={connect}
          disabled={connecting}
          className="absolute left-1/2 -translate-x-1/2 bottom-6 rounded-full bg-white text-black px-5 py-2.5 text-sm shadow"
        >
          {status === "Ready" ? "Connect" : status}
        </button>
      )}
    </div>
  );
}
