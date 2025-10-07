import { useEffect, useRef, useState } from "react";

type Props = { faceId: string; agentId?: string; scale?: number };

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
        setStatus("Fetching key…");
        const r = await fetch("/api/simli-config", { cache: "no-store" });
        if (!r.ok) throw new Error("HTTP " + r.status);
        const { apiKey } = await r.json();

        const SimliCtor =
          (window as any).SimliClient?.SimliClient ||
          (window as any).SimliClient?.default ||
          (window as any).SimliClient;
        if (!SimliCtor) throw new Error("Simli UMD not found");

        const c = new (SimliCtor as any)();
        const init = c.Initialize?.bind(c) || c.initialize?.bind(c);
        if (!init) throw new Error("No Initialize/initialize");

        await init({
          apiKey,
          faceID: faceId, faceId,
          ...(agentId ? { agentId } : {}),
          videoRef: videoRef.current!,
          audioRef: audioRef.current!,
          handleSilence: true,
          enableConsoleLogs: true,
        });

        c.on?.("error", (e: any) => {
          console.error("[simli] error", e);
          setStatus("Simli error");
        });
        c.on?.("connected", () => {
          console.log("[simli] connected event fired");
          setConnected(true);
          setStatus("Connected");
          audioRef.current?.play?.().catch(() => {});
        });

        // Check video metadata
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            console.log("[simli] video metadata loaded:", {
              width: videoRef.current?.videoWidth,
              height: videoRef.current?.videoHeight,
              srcObject: videoRef.current?.srcObject
            });
          };
          videoRef.current.onplay = () => {
            console.log("[simli] video playing");
          };
        }

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
    if (!client) { setStatus("Client not ready"); return; }

    try {
      setStatus("Requesting mic…");
      const mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      const track = mic.getAudioTracks()[0];
      if (!track) throw new Error("No mic track");

      // Never route mic to our speakers
      if (audioRef.current && (audioRef.current as any).srcObject) {
        (audioRef.current as any).srcObject = null;
      }

      // Send mic to Simli (API variants supported)
      const send =
        (client.listenToMediastreamTrack && client.listenToMediastreamTrack.bind(client)) ||
        (client.sendAudioTrack && client.sendAudioTrack.bind(client));
      if (!send) throw new Error("Simli SDK missing mic method");
      await send(track);

      setStatus("Starting session…");
      const start =
        (client.start && client.start.bind(client)) ||
        (client.connect && client.connect.bind(client)) ||
        (client.Start && client.Start.bind(client)) ||
        (client.Connect && client.Connect.bind(client));
      if (!start) throw new Error("No start/connect on client");

      console.log("[simli] calling start(), videoRef.srcObject before:", videoRef.current?.srcObject);
      await start(); // user gesture
      console.log("[simli] start() completed, videoRef.srcObject after:", videoRef.current?.srcObject);

      if (audioRef.current) {
        audioRef.current.muted = false;
        try { await audioRef.current.play(); } catch {}
      }
      setConnected(true);
      setStatus("Connected");
    } catch (e: any) {
      console.error("[StageSimli connect]", e);
      setStatus(
        /NotAllowedError/i.test(e?.name || "") ? "Mic blocked by browser" :
        /AudioContext/i.test(e?.message || "") ? "Audio device error" :
        "Start failed: " + (e?.message ?? String(e))
      );
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
        <audio ref={audioRef} autoPlay playsInline />
      </div>

      {/* Halo */}
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
      {/* tiny debug line */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[11px] text-white/70">{status}</div>
    </div>
  );
}
