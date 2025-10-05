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
      {/* Main ring */}
      <div
        className="absolute rounded-full ring-1 ring-white/70"
        style={{
          width: d,
          height: d,
          left: `calc(${cx} - (${d}/2))`,
          top: `calc(${cy} - (${d}/2))`,
          boxShadow: "0 20px 80px rgba(0,0,0,0.12)",
          background: "transparent",
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
