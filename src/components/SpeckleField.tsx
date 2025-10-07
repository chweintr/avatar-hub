import { useEffect, useRef } from "react";

type Props = {
  density?: number;
  speed?: number;
  opacity?: number;
  zIndex?: number;
};

export default function SpeckleField({
  density = 220,
  speed = 0.12,
  opacity = 0.55,
  zIndex = 0,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d", { alpha: true })!;
    let dpr = Math.min(1.5, window.devicePixelRatio || 1);
    let w = c.clientWidth, h = c.clientHeight;

    const resize = () => {
      w = c.clientWidth; h = c.clientHeight;
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const dots = Array.from({ length: density }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.2 + 0.4,
      a: Math.random() * 0.7 + 0.3,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
    }));

    const onMove = (e: MouseEvent) => {
      const rect = c.getBoundingClientRect();
      mouse.current.x = (e.clientX - rect.left) / rect.width - 0.5;
      mouse.current.y = (e.clientY - rect.top) / rect.height - 0.5;
    };
    window.addEventListener("mousemove", onMove);

    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(33, t - last); last = t;
      ctx.clearRect(0, 0, w, h);

      // melt-to-center vignette
      const g = ctx.createRadialGradient(w/2, h*0.45, 0, w/2, h*0.45, Math.max(w,h)/2);
      g.addColorStop(0, `rgba(255,255,255,${0.06*opacity})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0,0,w,h);

      const mx = mouse.current.x * 0.6;
      const my = mouse.current.y * 0.6;
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(255,255,255,${0.75*opacity})`;

      for (const p of dots) {
        p.x += p.vx + mx * 0.15;
        p.y += p.vy + my * 0.15;

        // soft wrap
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        ctx.globalAlpha = p.a * opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    const vis = () => {
      if (document.visibilityState === "hidden") cancelAnimationFrame(raf.current);
      else raf.current = requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", vis);

    const ro = new ResizeObserver(resize);
    ro.observe(c);

    return () => {
      cancelAnimationFrame(raf.current);
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("mousemove", onMove);
      ro.disconnect();
    };
  }, [density, speed, opacity]);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex, pointerEvents: "none", mixBlendMode: "screen" }}
    />
  );
}
