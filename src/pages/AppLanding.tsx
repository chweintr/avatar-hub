import { useMemo, useState } from "react";
import StageLiveKit from "../components/StageLiveKit";
import { Dock } from "../components/Dock";
import { AVATARS } from "../config/avatars";
import BackgroundFog from "../components/BackgroundFog";
import Portal from "../components/Portal";

export default function AppLanding() {
  const [activeId, setActiveId] = useState<string | undefined>(AVATARS[0]?.id);
  const [connected, setConnected] = useState(false);
  const active = useMemo(() => AVATARS.find(a => a.id === activeId), [activeId]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center gap-12 p-8">
      {/* Fog background */}
      <BackgroundFog />

      {/* Title */}
      <h1 className="relative z-10 text-4xl font-bold text-white/90 tracking-tight">
        Caleb's Club
      </h1>

      {/* Portal stage */}
      <Portal>
        {active ? (
          <StageLiveKit
            roomName={active.room}
            bare
            onConnectionChange={setConnected}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">
            Select an avatar
          </div>
        )}
      </Portal>

      {/* Dock */}
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
  );
}
