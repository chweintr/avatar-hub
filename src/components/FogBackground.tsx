import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

type FogBackgroundProps = { attachTo?: React.RefObject<HTMLDivElement> };

export function FogBackground({ attachTo }: FogBackgroundProps) {
  const ref = attachTo ?? useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0), my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 120, damping: 20 });
  const smy = useSpring(my, { stiffness: 120, damping: 20 });

  function onMouseMove(e: React.MouseEvent) {
    const el = (attachTo?.current ?? ref.current);
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  }
  function onLeave() { mx.set(0); my.set(0); }

  const l1x = useTransform(smx, v => v * 30), l1y = useTransform(smy, v => v * 30);
  const l2x = useTransform(smx, v => v * -40), l2y = useTransform(smy, v => v * -40);
  const l3x = useTransform(smx, v => v * 20), l3y = useTransform(smy, v => v * 20);

  return (
    <div ref={ref} onMouseMove={onMouseMove} onMouseLeave={onLeave} className="absolute inset-0" aria-hidden>
      <motion.div style={{ x: l1x, y: l1y }} className="absolute -top-28 -left-28 h-[65vmax] w-[65vmax] rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(184,241,255,0.35), rgba(255,255,255,0))" } as any}/>
      <motion.div style={{ x: l2x, y: l2y }} className="absolute -bottom-28 -right-28 h-[65vmax] w-[65vmax] rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(255,211,235,0.35), rgba(255,255,255,0))" } as any}/>
      <motion.div style={{ x: l3x, y: l3y }} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[45vmax] w-[45vmax] rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(255,243,176,0.35), rgba(255,255,255,0))" } as any}/>
    </div>
  );
}