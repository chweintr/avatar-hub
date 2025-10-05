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
  const [micEnabled, setMicEnabled] = useState(false);
  const [client, setClient] = useState<any>(null);
  const mountedRef = useRef(false);
  const micStreamRef = useRef<MediaStream | null>(null);

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
          audioRef: audioRef.current!,
          handleSilence: true,
          enableConsoleLogs: true,
        };
        if (agentId) cfg.agentId = agentId;

        const init = (c.Initialize && c.Initialize.bind(c)) || (c.initialize && c.initialize.bind(c));
        if (!init) throw new Error("No Initialize/initialize");

        setStatus("Initializing…");
        await init(cfg);
        if (cancelled) return;

        c.on?.("connected", () => { console.log("Simli WebRTC connected"); });
        c.on?.("error",     (e: any) => { console.error(e); setStatus("Simli error"); });

        setClient(c);

        // Start Simli immediately to show the avatar (idle state)
        setStatus("Starting avatar…");
        const start = (c.start && c.start.bind(c)) || (c.connect && c.connect.bind(c));
        if (start) {
          try {
            await start();
            setReady(true);
            setStatus("Ready. Click Connect.");
          } catch (e: any) {
            console.error("Auto-start failed:", e);
            setReady(true);
            setStatus("Ready. Click Connect.");
          }
        } else {
          setReady(true);
          setStatus("Ready. Click Connect.");
        }
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

    // When using agentId, we need to explicitly enable bidirectional audio
    setStatus("Starting conversation…");
    try {
      // Start audio streaming with the agent
      if (client.StartAudioToAudioSession) {
        await client.StartAudioToAudioSession();
        setMicEnabled(true);
        setStatus("Connected");
      } else if (client.startAudioToAudioSession) {
        await client.startAudioToAudioSession();
        setMicEnabled(true);
        setStatus("Connected");
      } else {
        console.warn("No StartAudioToAudioSession method found - using fallback mic approach");
        // Fallback: just request permission (agent backend may auto-connect)
        const mic = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
        micStreamRef.current = mic;
        setMicEnabled(true);
        setStatus("Connected");
      }
    } catch (e: any) {
      console.error(e);
      setStatus("Connection failed: " + (e?.message ?? String(e)));
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
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: `scale(${scale})` }}
        />
        {/* Audio element for Simli OUTPUT only (TTS/voice response) - never monitors mic input */}
        <audio ref={audioRef} autoPlay muted={false} />
        {/* tiny status overlay for debugging; remove later */}
        <div className="absolute inset-x-0 bottom-2 text-center text-[11px] text-white/75 pointer-events-none">
          {micEnabled ? "" : status}
        </div>
      </div>

      {/* Ring/frame */}
      <div className="absolute inset-0 rounded-full ring-2 ring-white/85 shadow-[0_40px_120px_rgba(0,0,0,0.15)] pointer-events-none" />

      {!micEnabled && (
        <button
          onClick={onConnect}
          disabled={!ready}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white text-black px-6 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
        >
          {ready ? "Connect" : status}
        </button>
      )}
    </div>
  );
}
