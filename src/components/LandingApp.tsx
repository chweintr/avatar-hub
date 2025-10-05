import { useEffect, useMemo, useRef, useState } from "react";
import SimliBackdrop from "./SimliBackdrop";
import PunchOut from "./PunchOut";
import StageFrame from "./StageFrame";
import AgentPlaceholder from "./AgentPlaceholder";
import NavBar from "./NavBar";
import { Dock } from "./Dock";
import AnimatedBackground from "./AnimatedBackground";
import GrainOverlay from "./GrainOverlay";
import { AVATARS, type DockAvatar } from "../config/avatars";
import { IS_SIMLI_LIVE } from "../config/env";
import { DEBUG_SIMLI } from "../config/flags";
import ConnectOverlay from "./ConnectOverlay";

export default function LandingApp() {
  const [active, setActive] = useState<DockAvatar | undefined>();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const url = active && IS_SIMLI_LIVE ? active.simliUrl : undefined;
  const [showConnectOverlay, setShowConnectOverlay] = useState(false);

  useEffect(() => {
    if (url) {
      setShowConnectOverlay(true);
    } else {
      setShowConnectOverlay(false);
    }
  }, [url]);

  const overlayScale = useMemo(() => {
    if (!active?.simliUrl) return undefined;
    if (typeof window === "undefined") return undefined;

    try {
      const parsed = new URL(active.simliUrl, window.location.origin);
      const scaleParam = parsed.searchParams.get("scale");
      if (!scaleParam) return undefined;
      const numeric = Number(scaleParam);
      return Number.isFinite(numeric) ? numeric : undefined;
    } catch (error) {
      if (DEBUG_SIMLI) {
        console.warn("Failed to parse Simli scale from URL", error);
      }
      return undefined;
    }
  }, [active?.simliUrl]);

  return (
    <div className="relative min-h-screen">
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

      {/* Layer 5: connect overlay */}
      {url && (
        <ConnectOverlay
          iframeRef={iframeRef}
          visible={showConnectOverlay}
          scale={overlayScale}
          onReady={() => setShowConnectOverlay(false)}
          cx="50%"
          cy="40vh"
          d="min(58vmin, 640px)"
        />
      )}

      {/* Nav bar */}
      <NavBar />

      {/* Main content */}
      <div className="relative z-[25] mx-auto max-w-6xl px-6 pt-20 pb-16">
        {/* Stage area with placeholder */}
        <section className="mt-10 flex justify-center">
          <div
            className="relative rounded-full"
            style={{ width: "min(58vmin, 640px)", aspectRatio: "1 / 1" }}
          >
            {/* Show rotating gradient when no agent is active */}
            {!url && <AgentPlaceholder />}
          </div>
        </section>

        {/* Dock */}
        <section id="dock" className="relative mt-16 flex justify-center">
          <Dock avatars={AVATARS} activeId={active?.id} onSelect={setActive} />
        </section>
      </div>
    </div>
  );
}
