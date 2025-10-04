import { useState } from "react";
import StageCircle from "./StageCircle";
import { Dock } from "./Dock";
import { FogBackground } from "./FogBackground";
import { AVATARS, type DockAvatar } from "../config/avatars";
import { IS_SIMLI_LIVE } from "../config/env";

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
            mode={
              active
                ? active.simliUrl && IS_SIMLI_LIVE
                  ? "simli"
                  : active.heygenUrl && IS_SIMLI_LIVE
                  ? "heygen"
                  : "media"
                : "empty"
            }
            simliUrl={IS_SIMLI_LIVE ? active?.simliUrl : undefined}
            heygenUrl={IS_SIMLI_LIVE ? active?.heygenUrl : undefined}
            posterSrc={active?.thumbnail}
            onDismiss={() => setActive(undefined)}
          />
        </div>

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