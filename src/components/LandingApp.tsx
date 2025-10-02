import { useState } from "react";
import StageCircle from "./StageCircle";
import { Dock } from "./Dock";
import { FogBackground } from "./FogBackground";
import { AVATARS, type DockAvatar } from "../config/avatars";

export default function LandingApp() {
  const [active, setActive] = useState<DockAvatar | undefined>();

  return (
    <div className="min-h-screen bg-white text-neutral-900 relative overflow-hidden">
      <FogBackground />
      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-8 pb-16">
        {/* header pill */}
        <div className="flex items-center justify-between rounded-full bg-neutral-900/[.04] border border-neutral-900/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-gradient-to-br from-pink-200 to-cyan-200" />
            <span className="text-sm font-medium tracking-tight text-neutral-700">Avatar Hub</span>
          </div>
          <nav className="hidden sm:flex items-center gap-5 text-sm text-neutral-600">
            <a href="#dock" className="hover:opacity-70">Studio Tools</a>
            <a href="/hub" className="hover:opacity-70">Projection Hub</a>
            <a href="/about" className="hover:opacity-70">About</a>
          </nav>
        </div>

        {/* stage */}
        <div className="mt-10 flex justify-center">
          <StageCircle
            mode={active?.simliUrl ? "simli" : active?.heygenUrl ? "heygen" : active ? "media" : "empty"}
            simliUrl={active?.simliUrl}
            heygenUrl={active?.heygenUrl}
            posterSrc={active?.thumbnail}
            onDismiss={() => setActive(undefined)}
          />
        </div>

        {/* dock */}
        <div id="dock" className="mt-10 flex justify-center">
          <Dock avatars={AVATARS} activeId={active?.id} onSelect={setActive} />
        </div>
      </div>
    </div>
  );
}