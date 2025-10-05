import React from "react";

// Pure visuals: ring + soft halo. No content inside. Sits above PunchOut.
export default function StageFrame({
  cx = "50%",
  cy = "40vh",
  d = "min(58vmin, 640px)",
}: {
  cx?: string;
  cy?: string;
  d?: string;
}) {
  const style: React.CSSProperties = {
    position: "fixed",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    zIndex: 20,
  };

  return (
    <div style={style} aria-hidden>
      {/* Main ring with layered shadows */}
      <div
        className="absolute rounded-full"
        style={{
          width: d,
          height: d,
          left: `calc(${cx} - (${d}/2))`,
          top: `calc(${cy} - (${d}/2))`,
          border: "8px solid rgba(255, 255, 255, 1)",
          boxShadow:
            "0 0 0 2px rgba(255,255,255,.35) inset, 0 40px 120px rgba(10,14,20,.15), 0 0 0px rgba(255,255,255, 0)",
          background:
            "radial-gradient(circle at 50% 40%, rgba(255,255,255,.08), rgba(255,255,255,0) 55%)",
          // CSS variables for potential animation
          ["--rg-spread" as string]: "0px",
          ["--rg-alpha" as string]: "0",
        }}
      />
      {/* Subtle inner halo */}
      <div
        className="absolute rounded-full blur-2xl"
        style={{
          width: `calc(${d} - 3rem)`,
          height: `calc(${d} - 3rem)`,
          left: `calc(${cx} - ((${d} - 3rem)/2))`,
          top: `calc(${cy} - ((${d} - 3rem)/2))`,
          background:
            "radial-gradient(closest-side, rgba(255,255,255,0.8), rgba(255,255,255,0))",
        }}
      />
    </div>
  );
}
