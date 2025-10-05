import { useState } from "react";
import SimliBackdrop from "./SimliBackdrop";
import PunchOut from "./PunchOut";
import StageFrame from "./StageFrame";
import { Dock } from "./Dock";
import { FogBackground } from "./FogBackground";
import { AVATARS, type DockAvatar } from "../config/avatars";
import { IS_SIMLI_LIVE } from "../config/env";

export default function LandingApp() {
  const [active, setActive] = useState<DockAvatar | undefined>();
  const url = active && IS_SIMLI_LIVE ? active.simliUrl : undefined;

  return (
    <div className="relative min-h-screen">
      {/* Layer 1: Simli behind everything */}
      <SimliBackdrop url={url} />

      {/* Layer 2: white overlay with circular hole */}
      <PunchOut cx="50%" cy="40vh" r="min(29vmin, 320px)" />

      {/* Layer 3: visual ring on top */}
      <StageFrame cx="50%" cy="40vh" d="min(58vmin, 640px)" />

      {/* Layer 4: Fog background */}
      <div className="relative z-20 pointer-events-none">
        <FogBackground />
      </div>

      {/* UI (on top) */}
      <div className="relative z-30 mx-auto max-w-6xl px-6 pt-8 pb-16">
        {/* header pill */}
        <div className="flex items-center justify-between rounded-full bg-neutral-900/[.04] border border-neutral-900/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-gradient-to-br from-pink-200 to-cyan-200" />
            <span className="text-sm font-medium tracking-tight text-neutral-700">
              Avatar Hub
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-5 text-sm text-neutral-600">
            <a href="#dock" className="hover:opacity-70">
              Studio Tools
            </a>
            <a href="/hub" className="hover:opacity-70">
              Projection Hub
            </a>
            <a href="/about" className="hover:opacity-70">
              About
            </a>
          </nav>
        </div>

        {/* stage placeholder */}
        <section className="mt-10 flex justify-center">
          <div className="h-[58vmin] max-h-[640px]" aria-label="Avatar stage window">
            {/* The circular window to the backdrop is rendered by PunchOut + StageFrame */}
          </div>
        </section>

        {/* dock */}
        <section id="dock" className="relative mt-10 flex justify-center">
          <div
            aria-hidden
            className="absolute inset-x-0 -top-8 bottom-0 mx-auto max-w-6xl rounded-[2rem] blur-2xl"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 0%, rgba(0,0,0,0.04), rgba(0,0,0,0))",
            }}
          />
          <div className="relative z-10">
            <Dock avatars={AVATARS} activeId={active?.id} onSelect={setActive} />
          </div>
        </section>
      </div>
    </div>
  );
}