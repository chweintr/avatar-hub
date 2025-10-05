import { useState, useRef, useEffect } from "react";
import SimliBackdrop from "./SimliBackdrop";
import PunchOut from "./PunchOut";
import StageFrame from "./StageFrame";
import ConnectOverlay from "./ConnectOverlay";
import { Dock } from "./Dock";
import AnimatedBackground from "./AnimatedBackground";
import GrainOverlay from "./GrainOverlay";
import { AVATARS, type DockAvatar } from "../config/avatars";
import { IS_SIMLI_LIVE } from "../config/env";

export default function LandingApp() {
  const [active, setActive] = useState<DockAvatar | undefined>();
  const [showConnect, setShowConnect] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const url = active && IS_SIMLI_LIVE ? active.simliUrl : undefined;

  useEffect(() => {
    setShowConnect(!!url);
  }, [url]);

  return (
    <div className="relative min-h-screen bg-[#0a0e14]">
      {/* Layer 0: Animated background */}
      <AnimatedBackground />

      {/* Layer 1: Grain overlay */}
      <GrainOverlay />

      {/* Layer 2: Simli iframe (only when avatar selected) */}
      <SimliBackdrop url={url} ref={iframeRef} />

      {/* Layer 3: white overlay with circular hole (only blocks Simli, not background) */}
      {url && <PunchOut cx="50%" cy="40vh" r="min(29vmin, 320px)" />}

      {/* Layer 4: visual ring on top */}
      <StageFrame cx="50%" cy="40vh" d="min(58vmin, 640px)" />

      {/* Connect overlay */}
      <ConnectOverlay
        iframeRef={iframeRef}
        visible={showConnect}
        scale={0.82}
        onReady={() => setShowConnect(false)}
        cx="50%"
        cy="40vh"
        d="min(58vmin, 640px)"
      />

      {/* UI (on top) */}
      <div className="relative z-30 mx-auto max-w-6xl px-6 pt-8 pb-16">
        {/* header pill */}
        <div className="flex items-center justify-between rounded-full bg-white/[.18] border border-white/20 px-4 py-3 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,.08)]">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-gradient-to-br from-pink-200 to-cyan-200" />
            <span className="text-sm font-medium tracking-tight text-neutral-800">
              Avatar Hub
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-5 text-sm text-neutral-700">
            <a href="#dock" className="hover:opacity-70 transition-opacity">
              Studio Tools
            </a>
            <a href="/hub" className="hover:opacity-70 transition-opacity">
              Projection Hub
            </a>
            <a href="/about" className="hover:opacity-70 transition-opacity">
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