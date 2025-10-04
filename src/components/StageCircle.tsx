import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

type StageCircleProps = {
  mode: "empty" | "simli" | "heygen" | "media";
  simliUrl?: string;
  heygenUrl?: string;
  posterSrc?: string; // used when mode === "media"
  onDismiss?: () => void;
};

export default function StageCircle({ mode, simliUrl, heygenUrl, posterSrc, onDismiss }: StageCircleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 140, damping: 18 });
  const smy = useSpring(my, { stiffness: 140, damping: 18 });

  // Tilt capped at ±4° for polish
  const rotateX = useTransform(smy, v => v * 4); // -4..+4
  const rotateY = useTransform(smx, v => v * -4);

  function onMouseMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;  // 0..1
    const y = (e.clientY - rect.top) / rect.height; // 0..1
    mx.set((x - 0.5) * 2); // -1..1
    my.set((y - 0.5) * 2);
  }
  function onMouseLeave() {
    mx.set(0); my.set(0);
  }

  return (
    <div className="relative grid place-items-center">
      {/* Stronger halo behind stage */}
      <div
        aria-hidden
        className="absolute -inset-10 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(0,0,0,0.06), rgba(0,0,0,0))",
        }}
      />

      <motion.div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative size-[58vmin] max-w-[640px] max-h-[640px] aspect-square rounded-full overflow-hidden shadow-stage bg-white ring-1 ring-white/70"
        data-testid="stage"
      >
        {mode === "simli" && simliUrl ? (
          <>
            {!iframeLoaded && (
              <div className="absolute inset-0 grid place-items-center text-neutral-500 text-sm">
                Loading avatar...
              </div>
            )}
            <iframe
              onLoad={() => setIframeLoaded(true)}
              title="Simli"
              src={simliUrl}
              className="absolute inset-0 h-full w-full"
              allow="microphone; camera; autoplay; clipboard-write; fullscreen *"
            />
          </>
        ) : mode === "heygen" && heygenUrl ? (
          <>
            {!iframeLoaded && (
              <div className="absolute inset-0 grid place-items-center text-neutral-500 text-sm">
                Loading avatar...
              </div>
            )}
            <iframe
              onLoad={() => setIframeLoaded(true)}
              title="HeyGen"
              src={heygenUrl}
              className="absolute inset-0 h-full w-full"
              allow="microphone; camera; autoplay; clipboard-write; fullscreen *"
            />
          </>
        ) : mode === "media" ? (
          posterSrc ? (
            <img src={posterSrc} alt="stage" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full grid place-items-center bg-neutral-100 text-neutral-500 text-sm">Drop media</div>
          )
        ) : (
          <div className="h-full w-full grid place-items-center bg-neutral-50 text-neutral-400 text-sm">Select an avatar</div>
        )}

        {/* subtle inner fog ring that drifts with tilt */}
        <motion.div
          aria-hidden
          style={{ x: useTransform(smx, v => v * 6), y: useTransform(smy, v => v * 6) }}
          className="pointer-events-none absolute inset-0 rounded-full"
        >
          <div className="absolute inset-6 rounded-full blur-2xl"
               style={{ background: "radial-gradient(closest-side, rgba(184,241,255,.18), rgba(255,255,255,0))" }} />
        </motion.div>

        {/* white-to-clear ring gradient on the edge */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            maskImage: "radial-gradient(circle, transparent 66%, black 70%)",
            WebkitMaskImage: "radial-gradient(circle, transparent 66%, black 70%)",
            background:
              "radial-gradient(closest-side, rgba(255,255,255,0.8), rgba(255,255,255,0))",
          }}
        />
      </motion.div>

      {onDismiss && mode !== "empty" && (
        <div className="mt-6">
          <button onClick={onDismiss} className="rounded-full bg-black text-white px-5 py-2.5 text-sm hover:opacity-90" data-testid="dismiss">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}