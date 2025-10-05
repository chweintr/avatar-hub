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
    setStatus("Starting…");
    const start = client.start?.bind(client) || client.connect?.bind(client);
    if (!start) { setStatus("No start/connect on client"); return; }
    try { await start(); } catch (e: any) { setStatus("Start failed: " + (e?.message ?? String(e))); }
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
