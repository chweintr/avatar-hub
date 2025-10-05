import { useMemo, useState } from "react";
import { Dock } from "../components/Dock";
import { AVATARS } from "../config/avatars";
import NavBar from "../components/NavBar";
import AnimatedBackground from "../components/AnimatedBackground";
import GrainOverlay from "../components/GrainOverlay";

export default function AppLanding() {
  const [activeId, setActiveId] = useState<string | undefined>();
  const active = useMemo(() => AVATARS.find(a => a.id === activeId), [activeId]);

  const simliUrl = active
    ? `/simli-agent.html?faceId=${active.faceId}${active.agentId ? `&agentId=${active.agentId}` : ''}${active.scale ? `&scale=${active.scale}` : ''}`
    : undefined;

  return (
    <div className="relative min-h-screen">
      {/* Layer 0: Animated background */}
      <AnimatedBackground />

      {/* Layer 1: Grain overlay */}
      <GrainOverlay />

      {/* Nav bar */}
      <NavBar />

      {/* Main content */}
      <div className="relative z-[25] mx-auto max-w-6xl px-6 pt-20 pb-16">
        {/* Stage area */}
        <section className="mt-10 flex justify-center">
          <div className="relative" style={{ width: "min(58vmin, 640px)", height: "min(58vmin, 640px)" }}>
            {simliUrl ? (
              <iframe
                src={simliUrl}
                allow="microphone; camera; autoplay"
                className="absolute inset-0 w-full h-full rounded-full border-0"
                style={{ zIndex: 10 }}
              />
            ) : (
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  border: "2px solid rgba(255,255,255,.85)",
                  background: "radial-gradient(60% 60% at 50% 40%, #111 0%, #000 60%)",
                  boxShadow: "0 40px 120px rgba(0,0,0,0.10) inset",
                }}
              />
            )}

            {/* Ring overlay */}
            <div className="absolute inset-0 rounded-full ring-2 ring-white/85 pointer-events-none" style={{ zIndex: 20 }} />
          </div>
        </section>

        {/* Dock */}
        <section id="dock" className="relative mt-16 flex justify-center">
          <Dock
            avatars={AVATARS}
            activeId={activeId}
            onSelect={setActiveId}
          />
        </section>
      </div>
    </div>
  );
}
