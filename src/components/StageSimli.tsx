import { useEffect, useRef, useState } from "react";

type Props = { faceId: string; agentId?: string; scale?: number };

export default function StageSimli({ faceId, agentId, scale = 0.82 }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [status, setStatus] = useState("Booting…");
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        console.log("[simli] fetch key");
        setStatus("Fetching key…");
        const r = await fetch("/api/simli-config", { cache: "no-store" });
        if (!r.ok) throw new Error("HTTP " + r.status);
        const { apiKey } = await r.json();
        if (!apiKey) throw new Error("SIMLI_API_KEY missing");

        console.log("[simli] import sdk");
        setStatus("Loading SDK…");
        const mod: any = await import("https://cdn.jsdelivr.net/npm/simli-client@1.2.15/+esm");
        const SimliCtor = mod?.SimliClient ?? mod?.default;
        if (typeof SimliCtor !== "function") throw new Error("Bad SDK export");

        console.log("[simli] create client");
        const c = new SimliCtor();

        const init = c.Initialize?.bind(c) ?? c.initialize?.bind(c);
        if (!init) throw new Error("No Initialize/initialize");

        console.log("[simli] initialize");
        await init({
          apiKey,
          faceID: faceId, faceId,
          ...(agentId ? { agentId } : {}),
          videoRef: videoRef.current!,
          audioRef: audioRef.current!,
          handleSilence: false,        // we'll attach mic after start()
          enableConsoleLogs: true,
        });

        c.on?.("error", (e: any) => { console.error("[simli] error", e); setStatus("Simli error"); });
        c.on?.("connected", () => { console.log("[simli] connected"); setConnected(true); setStatus("Connected"); });

        setClient(c);
        setReady(true);
        setStatus("Ready");
        console.log("[simli] ready");
      } catch (e: any) {
        if (!cancelled) { console.error("[simli] init error", e); setStatus("Init error: " + (e?.message ?? String(e))); }
      }
    })();
    return () => { cancelled = true; };
  }, [faceId, agentId]);

  async function onConnect() {
    console.log("[simli] connect click");
    if (!client) { setStatus("Client not ready"); return; }

    try {
      setStatus("Starting session…");
      const start =
        client.start?.bind(client) ??
        client.connect?.bind(client) ??
        client.Start?.bind(client) ??
        client.Connect?.bind(client);
      if (!start) throw new Error("No start/connect on client");

      console.log("[simli] start()");
      await start();  // start session first (prevents 'Session not initialized')
      console.log("[simli] start() done");

      setStatus("Requesting mic…");
      const mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      const track = mic.getAudioTracks()[0];
      if (!track) throw new Error("No mic track");

      console.log("[simli] mic track:", {
        id: track.id,
        label: track.label,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState
      });

      // Test mic levels
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(mic);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        if (avg > 10) console.log("[simli] mic level:", Math.round(avg));
      };
      setInterval(checkLevel, 500);

      // hard guard: never route mic to speakers
      if (audioRef.current && (audioRef.current as any).srcObject) {
        (audioRef.current as any).srcObject = null;
      }

      const send =
        client.listenToMediastreamTrack?.bind(client) ??
        client.sendAudioTrack?.bind(client);
      if (!send) throw new Error("SDK missing mic method");

      console.log("[simli] send mic track, method:", send.name || 'anonymous');
      await send(track);
      console.log("[simli] mic track sent successfully");

      if (audioRef.current) {
        audioRef.current.muted = false;
        await audioRef.current.play().catch(() => {});
      }

      setConnected(true);
      setStatus("Connected");
      console.log("[simli] connected/playing");
    } catch (e: any) {
      console.error("[simli] connect error", e);
      setStatus(
        /NotAllowedError/i.test(e?.name || "") ? "Mic blocked by browser" :
        "Start failed: " + (e?.message ?? String(e))
      );
    }
  }

  return (
    <div className="relative mx-auto" style={{ width: "min(58vmin, 640px)", height: "min(58vmin, 640px)" }}>
      <div className="absolute inset-0 rounded-full overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: `scale(${scale})` }}
          onPlay={() => console.log("[simli] <video> playing")}
          onLoadedMetadata={() => console.log("[simli] <video> meta", videoRef.current?.videoWidth, videoRef.current?.videoHeight, videoRef.current?.srcObject)}
        />
        <audio ref={audioRef} autoPlay playsInline />
      </div>
      <div className="absolute inset-0 rounded-full ring-2 ring-white/85 pointer-events-none" />
      {!connected && (
        <button
          onClick={onConnect}
          disabled={!ready}
          className="absolute z-50 left-1/2 -translate-x-1/2 bottom-6 rounded-full bg-white text-black px-5 py-2.5 text-sm shadow"
        >
          {ready ? "Connect" : status}
        </button>
      )}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[11px] text-white/70">{status}</div>
    </div>
  );
}
