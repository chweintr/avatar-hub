import { useEffect, useRef, useState } from "react";
import { getSimliClient } from "../lib/simliClient";

type Props = {
  faceId: string;
  agentId?: string;
  scale?: number;
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
        setStatus("Fetching Simli token…");
        const r = await fetch("/api/simli-config", { cache: "no-store" });
        if (!r.ok) throw new Error("HTTP " + r.status);
        const { apiKey } = await r.json();
        if (!apiKey) throw new Error("No SIMLI_API_KEY");

        setStatus("Loading SDK…");
        const c = await getSimliClient();

        // Some SDKs expose Initialize vs initialize — support both
        const initialize =
          (c.Initialize && c.Initialize.bind(c)) ||
          (c.initialize && c.initialize.bind(c));
        if (!initialize) throw new Error("No Initialize/initialize");

        const cfg: any = {
          apiKey,
          faceID: faceId, faceId,
          videoRef: videoRef.current!,
          audioRef: audioRef.current!,
          handleSilence: true,
          enableConsoleLogs: true,
          // Safe hint: many SDKs will prefer direct <audio> playback
          preferAudioElement: true, // no-op if unsupported
        };
        if (agentId) cfg.agentId = agentId;

        setStatus("Initializing…");
        await initialize(cfg);
        if (cancelled) return;

        c.on?.("error", (e: any) => {
          console.error("[simli] error", e);
          setStatus("Simli error");
        });
        c.on?.("connected", () => {
          setConnected(true);
          setStatus("Connected");
          // Nudge the HTMLAudioElement in case autoplay was paused
          audioRef.current?.play?.().catch(() => {});
        });

        setClient(c);
        setReady(true);
        setStatus("Ready. Click Connect.");
      } catch (e: any) {
        if (!cancelled) setStatus("Init error: " + (e?.message ?? String(e)));
      }
    })();

    return () => {
      cancelled = true;
      // Don't create/destroy contexts repeatedly — only stop if truly leaving the page
      // We intentionally DO NOT reset here to keep the singleton alive between avatar switches.
    };
  }, [faceId, agentId]);

  async function onConnect() {
    if (!client) return;
    setStatus("Starting…");

    try {
      // Route to default output device (if supported)
      try {
        await (audioRef.current as any)?.setSinkId?.("default");
      } catch {}

      // Make sure it's not muted by default
      if (audioRef.current) audioRef.current.muted = false;

      const start = client.start?.bind(client) || client.connect?.bind(client);
      if (!start) throw new Error("No start/connect on client");

      await start(); // user gesture unlock
      await audioRef.current?.play().catch(() => {});

      setConnected(true);
      setStatus("Connected");
    } catch (e: any) {
      // Surface WebAudio renderer issues clearly
      setStatus(
        /AudioContext/i.test(e?.message ?? "")
          ? "Audio device blocked. See tips below."
          : "Start failed: " + (e?.message ?? String(e))
      );
      console.error("[connect]", e);
    }
  }

  // Optional: if the tab was suspended, resume audio on visibility change
  useEffect(() => {
    function onVis() {
      if (document.visibilityState === "visible") {
        audioRef.current?.play?.().catch(() => {});
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div className="relative mx-auto" style={{ width: "min(58vmin, 640px)", height: "min(58vmin, 640px)" }}>
      <div className="absolute inset-0 rounded-full overflow-hidden bg-black">
        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" style={{ transform: `scale(${scale})` }} />
        <audio ref={audioRef} autoPlay playsInline controls={false} />
      </div>
      <div className="absolute inset-0 rounded-full ring-2 ring-white/85 pointer-events-none" />

      {!connected && (
        <button
          onClick={onConnect}
          disabled={!ready}
          className="absolute left-1/2 -translate-x-1/2 bottom-6 rounded-full bg-white text-black px-5 py-2.5 text-sm shadow"
        >
          {ready ? "Connect" : status}
        </button>
      )}

      {/* Debug line */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[11px] text-white/70">{status}</div>
    </div>
  );
}
