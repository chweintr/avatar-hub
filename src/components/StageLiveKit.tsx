import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, RemoteTrackPublication, RemoteVideoTrack, RemoteAudioTrack } from "livekit-client";

export default function StageLiveKit({
  roomName,
  bare = false,
  onConnectionChange
}: {
  roomName: string;
  bare?: boolean;
  onConnectionChange?: (connected: boolean) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [status, setStatus] = useState("Idle");
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => () => {
    room?.disconnect();
    onConnectionChange?.(false);
  }, [room, onConnectionChange]);

  async function connect() {
    try {
      setStatus("Fetching token…");
      const user = crypto.randomUUID();
      const r = await fetch(`/api/livekit-token?room=${encodeURIComponent(roomName)}&user=${user}`);
      if (!r.ok) { setStatus("Token 500"); return; }
      const { url, token } = await r.json();

      const lkRoom = new Room({ adaptiveStream: true, dynacast: true });

      // Attach tracks as they're subscribed
      lkRoom.on(RoomEvent.TrackSubscribed, (track, pub: RemoteTrackPublication, participant) => {
        console.log("[livekit] track subscribed:", pub.kind, "from", participant.identity);
        if (pub.kind === "video" && videoRef.current) {
          (track as RemoteVideoTrack).attach(videoRef.current);
          setStatus(`Watching ${participant.name || participant.identity}`);
        }
        if (pub.kind === "audio" && audioRef.current) {
          (track as RemoteAudioTrack).attach(audioRef.current);
          console.log("[livekit] audio track attached");
        }
      });

      lkRoom.on(RoomEvent.TrackUnsubscribed, (track, pub: RemoteTrackPublication) => {
        if (pub.kind === "video" && videoRef.current) {
          (track as RemoteVideoTrack).detach(videoRef.current);
        }
        if (pub.kind === "audio" && audioRef.current) {
          (track as RemoteAudioTrack).detach(audioRef.current);
        }
      });

      setStatus("Joining…");
      await lkRoom.connect(url, token);

      // Enable microphone (you speak to the agent) - user gesture required
      console.log("[livekit] enabling microphone...");
      await lkRoom.localParticipant.setMicrophoneEnabled(true);
      console.log("[livekit] microphone enabled");

      // Disable camera (visuals come from Simli avatar)
      await lkRoom.localParticipant.setCameraEnabled(false);

      // Attach any existing tracks (in case avatar joined before us)
      lkRoom.remoteParticipants.forEach(p => {
        p.trackPublications.forEach((pub: RemoteTrackPublication) => {
          if (pub.isSubscribed && pub.track) {
            if (pub.kind === "video" && videoRef.current) {
              (pub.track as RemoteVideoTrack).attach(videoRef.current);
            }
            if (pub.kind === "audio" && audioRef.current) {
              (pub.track as RemoteAudioTrack).attach(audioRef.current);
              console.log("[livekit] existing audio track attached");
            }
          }
        });
      });

      setRoom(lkRoom);
      setStatus("Connected");
      onConnectionChange?.(true);
      console.log("[livekit] connected to room:", roomName);
    } catch (e: any) {
      console.error("[livekit] connect error:", e);
      setStatus("Error: " + (e?.message || String(e)));
    }
  }

  function disconnect() {
    if (room) {
      room.disconnect();
      setRoom(null);
      setStatus("Disconnected");
      onConnectionChange?.(false);
      console.log("[livekit] disconnected");
    }
  }

  if (bare) {
    return (
      <>
        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
        <audio ref={audioRef} autoPlay playsInline muted={false} />
        {!room ? (
          <button
            onClick={connect}
            className="absolute z-50 left-1/2 -translate-x-1/2 bottom-6 rounded-full bg-white text-black px-5 py-2.5 text-sm shadow hover:bg-gray-100"
          >
            Connect
          </button>
        ) : (
          <button
            onClick={disconnect}
            className="absolute z-50 left-1/2 -translate-x-1/2 bottom-6 rounded-full bg-red-500 text-white px-5 py-2.5 text-sm shadow hover:bg-red-600"
          >
            Disconnect
          </button>
        )}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[11px] text-white/70">{status}</div>
      </>
    );
  }

  return (
    <div className="relative mx-auto" style={{ width: "min(58vmin, 640px)", height: "min(58vmin, 640px)" }}>
      <div className="absolute inset-0 rounded-full overflow-hidden bg-black">
        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
        <audio ref={audioRef} autoPlay playsInline muted={false} />
      </div>
      <div className="absolute inset-0 rounded-full ring-2 ring-white/85 pointer-events-none" />
      {!room ? (
        <button
          onClick={connect}
          className="absolute z-50 left-1/2 -translate-x-1/2 bottom-6 rounded-full bg-white text-black px-5 py-2.5 text-sm shadow hover:bg-gray-100"
        >
          Connect
        </button>
      ) : (
        <button
          onClick={disconnect}
          className="absolute z-50 left-1/2 -translate-x-1/2 bottom-6 rounded-full bg-red-500 text-white px-5 py-2.5 text-sm shadow hover:bg-red-600"
        >
          Disconnect
        </button>
      )}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[11px] text-white/70">{status}</div>
    </div>
  );
}
