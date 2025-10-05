import { useEffect, useRef } from "react";

export default function AnimatedBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = ref.current!;
    const ctx = cvs.getContext("2d")!;
    let raf = 0;
    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cvs.width = Math.floor(innerWidth * dpr);
      h = cvs.height = Math.floor(innerHeight * dpr);
      cvs.style.width = `${innerWidth}px`;
      cvs.style.height = `${innerHeight}px`;
    };
    resize();
    addEventListener("resize", resize, { passive: true });

    // foggy pink-gray palette
    const blobs = Array.from({ length: 6 }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (Math.random() * 160 + 120) * dpr,
      hue: 320 + Math.random() * 50,
      amp: (10 + Math.random() * 20) * dpr,
      speed: 0.3 + Math.random() * 0.6,
      offset: Math.random() * Math.PI * 2
    }));

    const trail = Array.from({ length: 18 }).map(() => ({ x: w * 0.5, y: h * 0.5 }));
    const lerp = (a:number,b:number,t:number)=>a+(b-a)*t;
    let mouse = { x: w * 0.5, y: h * 0.5 };
    const onMove = (e: PointerEvent) => {
      const r = cvs.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * dpr;
      mouse.y = (e.clientY - r.top) * dpr;
    };
    addEventListener("pointermove", onMove, { passive: true });

    let t = 0;
    const draw = () => {
      t += 0.008;
      ctx.clearRect(0, 0, w, h);

      // soft background wash
      ctx.fillStyle = "#f4f2f6";
      ctx.fillRect(0, 0, w, h);

      // parallax blobs
      for (const b of blobs) {
        const px = b.x + Math.cos(t * b.speed + b.offset) * b.amp + (mouse.x - w * 0.5) * 0.02;
        const py = b.y + Math.sin(t * b.speed + b.offset) * b.amp + (mouse.y - h * 0.5) * 0.02;
        const g = ctx.createRadialGradient(px, py, b.r * 0.1, px, py, b.r);
        g.addColorStop(0, `hsla(${b.hue}, 45%, 82%, 0.12)`);
        g.addColorStop(1, `hsla(${b.hue}, 45%, 82%, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // "magnetic" cursor trail
      trail[0].x = lerp(trail[0].x, mouse.x, 0.25);
      trail[0].y = lerp(trail[0].y, mouse.y, 0.25);
      for (let i = 1; i < trail.length; i++) {
        trail[i].x = lerp(trail[i].x, trail[i - 1].x, 0.35);
        trail[i].y = lerp(trail[i].y, trail[i - 1].y, 0.35);
      }
      for (let i = 0; i < trail.length; i++) {
        const p = trail[i];
        const r = (12 + (trail.length - i) * 1.2) * dpr;
        const g = ctx.createRadialGradient(p.x, p.y, r * 0.1, p.x, p.y, r);
        g.addColorStop(0, "rgba(255,255,255,0.35)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={ref} className="fixed inset-0 z-0" aria-hidden="true" />;
}
