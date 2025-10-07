import { useMemo, useState, useEffect } from "react";
import StageLiveKit from "../components/StageLiveKit";
import { Dock } from "../components/Dock";
import { AVATARS } from "../config/avatars";
import BackgroundFog from "../components/BackgroundFog";
import DustOverlay from "../components/DustOverlay";
import Portal from "../components/Portal";
import SpeckleField from "../components/SpeckleField";

export default function AppLanding() {
  const [activeId, setActiveId] = useState<string | undefined>(AVATARS[0]?.id);
  const [connected, setConnected] = useState(false);
  const active = useMemo(() => AVATARS.find(a => a.id === activeId), [activeId]);

  // Parallax effect
  useEffect(() => {
    const el = document.getElementById("club-layers");
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const { innerWidth: w, innerHeight: h } = window;
      const x = (e.clientX - w / 2) / w;
      const y = (e.clientY - h / 2) / h;
      el.style.transform = `translate3d(${x * 16}px, ${y * 16}px, 0)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="min-h-screen">
      {/* background with parallax */}
      <div
        id="club-bg"
        className="bg-club fixed inset-0 -z-10 parallax-wrap"
        aria-hidden
      >
        <div id="club-layers" className="parallax-move h-full w-full" />
      </div>

      {/* Header */}
      <header className="pt-10 pb-4 text-center select-none">
        <h1 className="tracking-[.2em] text-white/95 text-[34px] sm:text-[40px] font-semibold">
          CALEB'S CLUB
        </h1>
        <p className="mt-2 text-white/70 text-sm">
          Studio agents · avatar conversations
        </p>
      </header>

      {/* Stage */}
      <section className="mt-2 flex justify-center relative z-10">
        {active ? (
          <div className="relative rounded-full stage-ring" style={{ width: "min(66vmin,740px)", height: "min(66vmin,740px)" }}>
            <div className="absolute inset-0 rounded-full overflow-hidden bg-black/95">
              <StageLiveKit
                roomName={active.room}
                bare
                onConnectionChange={setConnected}
              />
            </div>
            {/* small inner ring for a crisp edge */}
            <div className="pointer-events-none absolute inset-[10px] rounded-full ring-2 ring-white/90" />
          </div>
        ) : (
          <div
            className="relative rounded-full stage-ring stage-speckles bg-black/92"
            style={{ width: "min(66vmin,740px)", height: "min(66vmin,740px)" }}
            aria-label="Idle stage"
          />
        )}
      </section>

      {/* Dock */}
      <div className="mt-10 sm:mt-12 flex justify-center z-10 relative">
        <Dock
          avatars={AVATARS}
          activeId={activeId}
          busyId={connected ? activeId : undefined}
          onSelect={(id) => {
            setActiveId(id);
            setConnected(false);
          }}
        />
      </div>
    </div>
  );
}
