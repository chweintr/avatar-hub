import { useEffect, useRef } from "react";

export default function BackgroundFog() {
  const fog1 = useRef<HTMLDivElement>(null);
  const fog2 = useRef<HTMLDivElement>(null);
  const fog3 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;

      if (fog1.current) {
        fog1.current.style.transform = `translate(${x * 30}px, ${y * 30}px)`;
      }
      if (fog2.current) {
        fog2.current.style.transform = `translate(${x * -20}px, ${y * -20}px)`;
      }
      if (fog3.current) {
        fog3.current.style.transform = `translate(${x * 40}px, ${y * 40}px)`;
      }
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div
        ref={fog1}
        className="fog-blob"
        style={{
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, #14b8a6, transparent)",
          top: "10%",
          left: "20%",
        }}
      />
      <div
        ref={fog2}
        className="fog-blob"
        style={{
          width: "800px",
          height: "800px",
          background: "radial-gradient(circle, #ec4899, transparent)",
          bottom: "10%",
          right: "15%",
        }}
      />
      <div
        ref={fog3}
        className="fog-blob"
        style={{
          width: "700px",
          height: "700px",
          background: "radial-gradient(circle, #fbbf24, transparent)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}
