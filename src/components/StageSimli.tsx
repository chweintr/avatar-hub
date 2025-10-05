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

  useEffect(() => {
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

        c.on?.("connected", () => { setConnected(true); setStatus("Connected"); });
        c.on?.("error",     (e: any) => { console.error(e); setStatus("Simli error"); });

        setClient(c);
        setReady(true);
        setStatus("Ready");
      } catch (e: any) {
        if (!cancelled) setStatus("Init error: " + (e?.message ?? String(e)));
      }
    })();

    return () => { cancelled = true; };
  }, [faceId, agentId]);

  async function onConnect() {
    if (!client) return;
    // 1) Explicit mic permission (inside user gesture)
    setStatus("Requesting mic…");
    let mic: MediaStream | undefined;
    try {
      mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      const track = mic.getAudioTracks()[0];
      // 2) Give Simli the audio source (supported by the official client)
      if (client.listenToMediastreamTrack && track) {
        client.listenToMediastreamTrack(track);
      }
    } catch (e: any) {
      console.error(e);
      setStatus("Mic blocked: " + (e?.message ?? String(e)));
      return;
    }

    // 3) Start the WebRTC session
    setStatus("Starting…");
    const start =
      (client.start && client.start.bind(client)) ||
      (client.connect && client.connect.bind(client));
    if (!start) { setStatus("No start/connect on client"); return; }
    try {
      await start();
      setStatus("Connected");
    } catch (e: any) {
      console.error(e);
      setStatus("Start failed: " + (e?.message ?? String(e)));
      // Optional: stop mic if start failed
      try { mic?.getTracks().forEach(t => t.stop()); } catch {}
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
        <audio ref={audioRef} autoPlay />
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
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white text-black px-6 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
        >
          {ready ? "Connect" : status}
        </button>
      )}
    </div>
  );
}
