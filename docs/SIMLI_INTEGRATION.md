# Simli Integration Guide

## Why Previous Approaches Failed

1. **500 Error on `/api/simli-config`** → Client can't fetch API token, init stalls, Connect does nothing
2. **Iframe Architecture** → User gesture must happen in same document that starts media; cross-frame hacks are brittle

## Solution: In-Page Simli Client

No iframe. One page. Click dock avatar → main circle mounts Simli → shows Connect → click Connect → starts session.

---

## 0. Server Route (Railway)

Expose API token via JSON endpoint:

```typescript
// server/index.ts (Express)
app.get("/api/simli-config", (_req, res) => {
  const apiKey = process.env.SIMLI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Simli API token not configured" });
  res.json({ apiKey });
});
```

**Railway Setup:**
- Variables → add `SIMLI_API_KEY = <your token>`
- Redeploy
- Test: `https://your.app/api/simli-config` → must return `{ "apiKey": "…" }`

---

## 1. In-Page Simli Stage (No Iframe)

Uses Simli SDK exactly as documented: `new SimliClient()` → `Initialize(config)` → `start()`

```typescript
// src/components/StageSimli.tsx
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
        setStatus("Fetching token…");
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
          faceID: faceId,     // Simli examples vary; support both spellings
          faceId: faceId,
          videoRef: videoRef.current!,
          audioRef: audioRef.current!,
          handleSilence: true,
          enableConsoleLogs: true,
        };
        if (agentId) cfg.agentId = agentId;

        const initialize =
          (c.Initialize && c.Initialize.bind(c)) ||
          (c.initialize && c.initialize.bind(c));
        if (!initialize) throw new Error("No Initialize/initialize");

        setStatus("Initializing…");
        await initialize(cfg);
        if (cancelled) return;

        c.on?.("connected", () => { setConnected(true); setStatus("Connected"); });
        c.on?.("error", (e: any) => { console.error(e); setStatus("Simli error"); });

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
    const start = client.start?.bind(client) || client.connect?.bind(client); // API variance
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

      {/* Ring/halo */}
      <div className="absolute inset-0 rounded-full ring-2 ring-white/85 shadow-[0_40px_120px_rgba(0,0,0,0.15)] pointer-events-none" />

      {/* In-page Connect: valid user gesture */}
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
```

---

## 2. One-Page App Wiring

Click small face → set state → stage mounts that avatar

```typescript
// src/config/avatars.ts
export type AvatarCfg = {
  id: string;
  name: string;
  faceId: string;
  agentId?: string;
  scale?: number;
  thumb?: string
};

export const AVATARS: AvatarCfg[] = [
  { id: "tax",    name: "Tax Advisor",         faceId: "FACE_TAX",    agentId: "AGENT_TAX",    scale: 0.80, thumb: "/thumbs/tax.jpg" },
  { id: "brain",  name: "Studio Brainstormer", faceId: "FACE_BRAIN",  agentId: "AGENT_BRAIN",  scale: 0.82, thumb: "/thumbs/brain.jpg" },
  { id: "grants", name: "Grant / Residency",   faceId: "FACE_GRANTS", agentId: "AGENT_GRANTS", scale: 0.80, thumb: "/thumbs/grants.jpg" },
  { id: "crit",   name: "Crit Partner",        faceId: "FACE_CRIT",   agentId: "AGENT_CRIT",   scale: 0.78, thumb: "/thumbs/crit.jpg" },
];
```

```typescript
// src/components/Dock.tsx
type DockAvatar = { id: string; name: string; thumbnail?: string };

export function Dock({ avatars, activeId, onSelect }:{
  avatars: DockAvatar[];
  activeId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-8">
      {avatars.map(a => {
        const active = a.id === activeId;
        return (
          <button
            key={a.id}
            onClick={() => onSelect(a.id)}
            className={[
              "relative size-24 rounded-full bg-gradient-to-br from-white to-neutral-100 shadow-sm",
              active ? "outline outline-2 outline-black" : "hover:opacity-90"
            ].join(" ")}
            title={a.name}
          >
            {a.thumbnail && <img src={a.thumbnail} alt="" className="absolute inset-0 size-full object-cover rounded-full" />}
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-28 text-center text-xs font-medium">
              {a.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

```typescript
// src/pages/AppLanding.tsx (single page)
import { useMemo, useState } from "react";
import { AVATARS } from "../config/avatars";
import StageSimli from "../components/StageSimli";
import { Dock } from "../components/Dock";

export default function AppLanding() {
  const [activeId, setActiveId] = useState<string>();
  const active = useMemo(() => AVATARS.find(a => a.id === activeId), [activeId]);

  return (
    <div className="min-h-screen bg-white">
      {/* background/parallax layers — keep your effects here with z-0 and pointer-events-none */}

      <section className="mt-10 flex justify-center z-10 relative">
        {active
          ? <StageSimli faceId={active.faceId} agentId={active.agentId} scale={active.scale}/>
          : <div
              className="rounded-full"
              style={{
                width:"min(58vmin,640px)",
                height:"min(58vmin,640px)",
                border:"2px solid rgba(255,255,255,.85)",
                background:"radial-gradient(60% 60% at 50% 40%, #111 0%, #000 60%)",
                boxShadow:"0 40px 120px rgba(0,0,0,0.10) inset"
              }}
            />
        }
      </section>

      <div className="mt-14 flex justify-center z-30 relative">
        <Dock
          avatars={AVATARS.map(a => ({ id: a.id, name: a.name, thumbnail: a.thumb }))}
          activeId={activeId}
          onSelect={setActiveId}
        />
      </div>
    </div>
  );
}
```

---

## 3. Triage Checklist (Do in Order)

1. ✅ `/api/simli-config` on Railway returns `{ apiKey }` (200)
   - If not: fix variable on correct Railway service
2. ✅ Click dock item → Connect appears inside circle
3. ✅ Click Connect → mic/cam prompt → live face appears
   - If "Start failed: …" → send exact message (SDK method name may have changed)
4. ✅ Adjust framing by ±0.02 on `scale` per avatar if needed

---

## 4. Why This Aligns With Simli

Simli's JS SDK exposes:
- `SimliClient` constructor
- `Initialize(config)` method
- `start()` method
- Config includes: `apiKey`, `faceId`/`faceID`, `videoRef`, `audioRef`

This implementation follows their documented API exactly.

---

## 5. Layer Stack (Z-Index)

```
z-0:  Animated gradient/fog background (pointer-events-none)
z-10: StageSimli circle (video cropped; user can click)
z-20: Ring/halo/glass frame (pointer-events-none)
z-25: Grain overlay (pointer-events-none)
z-30: Nav and dock
```

No masks needed. Circular crop from `rounded-full overflow-hidden` eliminates square edges.

---

## Current Implementation Status

✅ StageSimli component created
✅ In-page architecture (no iframe)
✅ Single state management (`activeId`)
✅ Circular crop with overflow-hidden
✅ User gesture in same DOM
✅ Status surfaced in Connect button

### Known Working Avatars
- **Tax Advisor**: `faceId: afdb6a3e-3939-40aa-92df-01604c23101c`, `agentId: d951e6dc-c098-43fb-a34f-e970cd339ea6`
- **Grant/Residency**: `faceId: cace3ef7-a4c4-425d-a8cf-a5358eb0c427`

### Needs faceId/agentId
- Brainstormer
- Crit Partner
