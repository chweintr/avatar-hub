import { useEffect, useRef, useState } from "react";

type Props = {
  faceId: string;
  agentId?: string;
  scale?: number; // 0.76–0.86 usually
};

export default function StageSimli({ faceId, agentId, scale = 0.82 }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [status, setStatus] = useState("Loading…");
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [client, setClient] = useState<any>(null);
  const mountedRef = useRef(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const unmuteTimer = useRef<number | null>(null);

  useEffect(() => {
    // Guard against StrictMode double-mount
    if (mountedRef.current) return;
    mountedRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        setStatus("Fetching API key…");
        const r = await fetch("/api/simli-config", { cache: "no-store" });
        if (!r.ok) throw new Error("HTTP " + r.status);
        const { apiKey } = await r.json();

        setStatus("Loading SDK…");
        const mod = await import("https://cdn.jsdelivr.net/npm/simli-client@1.2.15/+esm");
        const SimliClient = (mod as any).SimliClient || (mod as any).default;
        if (!SimliClient) throw new Error("SDK export missing");

        setStatus("Creating client…");
        const c = new SimliClient();

        const cfg: any = {
          apiKey,
          faceID: faceId,         // cover both shapes
          faceId: faceId,
          videoRef: videoRef.current!,
          audioRef: audioRef.current!,   // Simli attaches REMOTE audio here
          handleSilence: false,  // Recommended for conversational AI
          enableConsoleLogs: true,
        };
        if (agentId) cfg.agentId = agentId;

        const init = (c.Initialize && c.Initialize.bind(c)) || (c.initialize && c.initialize.bind(c));
        if (!init) throw new Error("No Initialize/initialize");

        setStatus("Initializing…");
        await init(cfg);
        if (cancelled) return;

        // Avatar events
        c.on?.("connected", async () => {
          console.log("Simli WebRTC connected");

          // Now that we're connected, send the mic if we have it
          if (micStreamRef.current) {
            const track = micStreamRef.current.getAudioTracks()[0];
            if (track && c.listenToMediastreamTrack) {
              await c.listenToMediastreamTrack(track);
              console.log("Mic track sent to Simli");
            }
          }
        });

        c.on?.("error", (e: any) => {
          console.error(e);
          setStatus("Simli error");
        });

        c.on?.("speaking", () => {
          console.log("Avatar speaking");
        });

        setClient(c);
        setReady(true);
        setStatus("Ready");
      } catch (e: any) {
        if (!cancelled) setStatus("Init error: " + (e?.message ?? String(e)));
      }
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      // Cleanup mic stream
      micStreamRef.current?.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    };
  }, [faceId, agentId]);

  async function onConnect() {
    if (!client) return;

    try {
      // 1) Get mic first (need user gesture)
      setStatus("Requesting mic…");
      const mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      micStreamRef.current = mic;

      // CRITICAL: Never route mic to audio element
      if (audioRef.current?.srcObject === mic) {
        audioRef.current.srcObject = null;
      }

      // 2) Start session - this will trigger 'connected' event
      // The 'connected' handler will then send the mic track
      setStatus("Connecting…");
      const start = client.start?.bind(client) || client.connect?.bind(client);
      if (!start) {
        setStatus("No start/connect on client");
        return;
      }
      await start();

      setConnected(true);
      setStatus("Connected");
    } catch (e: any) {
      console.error(e);
      setStatus((e?.name === "NotAllowedError")
        ? "Mic blocked by browser"
        : "Error: " + (e?.message ?? String(e)));
    }
  }

  return (
    <div className="relative mx-auto" style={{ width: "min(58vmin, 640px)", height: "min(58vmin, 640px)" }}>
      {/* Circular crop */}
      <div className="absolute inset-0 rounded-full overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: `scale(${scale})` }}
        />
        <audio ref={audioRef} autoPlay playsInline muted />
        {/* tiny status overlay for debugging; remove later */}
        <div className="absolute inset-x-0 bottom-2 text-center text-[11px] text-white/75 pointer-events-none">
          {connected ? "" : status}
        </div>
      </div>

      {/* Ring/frame */}
      <div className="absolute inset-0 rounded-full ring-2 ring-white/85 shadow-[0_40px_120px_rgba(0,0,0,0.15)] pointer-events-none" />

      {!connected && (
        <button
          onClick={onConnect}
          disabled={!ready}
          className="absolute left-1/2 -translate-x-1/2 bottom-6 rounded-full bg-white text-black px-5 py-2.5 text-sm shadow"
        >
          {ready ? "Connect" : status}
        </button>
      )}
    </div>
  );
}
