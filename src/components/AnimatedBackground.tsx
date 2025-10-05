import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w: number, h: number, dpr: number;
    let animationId: number;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas!.width = Math.floor(innerWidth * dpr);
      h = canvas!.height = Math.floor(innerHeight * dpr);
      canvas!.style.width = innerWidth + 'px';
      canvas!.style.height = innerHeight + 'px';
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();

    // Parallax blobs config
    const blobs = Array.from({ length: 6 }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 160 * dpr + 120 * dpr,
      hue: 320 + Math.random() * 80,
      amp: 10 * dpr + Math.random() * 20 * dpr,
      speed: 0.3 + Math.random() * 0.6,
      offset: Math.random() * Math.PI * 2,
    }));

    // Cursor trail points
    const trail = Array.from({ length: 18 }).map(() => ({
      x: w * 0.5,
      y: h * 0.5,
      r: 12 * dpr,
      life: 1,
    }));

    const mouse = { x: w * 0.5, y: h * 0.5 };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) * dpr;
      mouse.y = (e.clientY - rect.top) * dpr;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    let t = 0;
    function draw() {
      t += 0.008;
      ctx!.clearRect(0, 0, w, h);

      // 1) Parallax blobs
      for (const b of blobs) {
        const px = b.x + Math.cos(t * b.speed + b.offset) * b.amp + (mouse.x - w * 0.5) * 0.02;
        const py = b.y + Math.sin(t * b.speed + b.offset) * b.amp + (mouse.y - h * 0.5) * 0.02;
        const grd = ctx!.createRadialGradient(px, py, b.r * 0.1, px, py, b.r);
        grd.addColorStop(0, `hsla(${b.hue}, 70%, 75%, 0.12)`);
        grd.addColorStop(1, `hsla(${b.hue}, 70%, 75%, 0)`);
        ctx!.fillStyle = grd;
        ctx!.beginPath();
        ctx!.arc(px, py, b.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      // 2) Magnetic trail
      trail[0].x = lerp(trail[0].x, mouse.x, 0.25);
      trail[0].y = lerp(trail[0].y, mouse.y, 0.25);
      for (let i = 1; i < trail.length; i++) {
        trail[i].x = lerp(trail[i].x, trail[i - 1].x, 0.35);
        trail[i].y = lerp(trail[i].y, trail[i - 1].y, 0.35);
      }

      for (let i = 0; i < trail.length; i++) {
        const p = trail[i];
        const r = (12 + (trail.length - i) * 1.2) * dpr;
        const grd = ctx!.createRadialGradient(p.x, p.y, r * 0.1, p.x, p.y, r);
        grd.addColorStop(0, 'rgba(255,255,255,0.35)');
        grd.addColorStop(1, 'rgba(255,255,255,0)');
        ctx!.fillStyle = grd;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx!.fill();
      }

      animationId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-0"
    />
  );
}
