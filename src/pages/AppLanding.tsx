import { useMemo, useState } from "react";
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

  return (
    <div className="min-h-screen relative bg-[#0b0b0c] text-white">
      {/* Foggy gradient bg */}
      <BackgroundFog />
      <DustOverlay />

      <header className="relative z-10 pt-8 text-center">
        <h1 className="tracking-[0.18em] text-[28px] sm:text-[32px] font-semibold text-white/95">
          CALEB'S CLUB
        </h1>
        <p className="mt-1 text-white/55 text-sm">Studio agents · avatar conversations</p>
      </header>

      <main className="relative z-10 mt-8 flex justify-center">
        <Portal>
          {/* Ambient speckles under video */}
          <SpeckleField density={240} speed={0.12} opacity={0.6} zIndex={0} />

          {/* Stage video layer */}
          {active ? (
            <StageLiveKit
              roomName={active.room}
              bare
              onConnectionChange={setConnected}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm z-10">
              Select an avatar
            </div>
          )}
        </Portal>
      </main>

      <section className="relative z-10 mt-14 mb-20 flex justify-center">
        <Dock
          avatars={AVATARS}
          activeId={activeId}
          busyId={connected ? activeId : undefined}
          onSelect={(id) => {
            setActiveId(id);
            setConnected(false);
          }}
        />
      </section>
    </div>
  );
}
