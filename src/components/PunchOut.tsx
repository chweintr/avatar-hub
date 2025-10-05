import React from "react";

// A white overlay with a circular hole so the backdrop shows through.
// Pointer-events none => clicks pass through the hole to the iframe.
export default function PunchOut({
  cx = "50%",
  cy = "40vh", // vertical center of the hole
  r = "min(29vmin, 320px)", // radius of the hole
}: {
  cx?: string;
  cy?: string;
  r?: string;
}) {
  const mask = `radial-gradient(circle at ${cx} ${cy}, transparent ${r}, black calc(${r} + 1px))`;
  const style: React.CSSProperties = {
    WebkitMaskImage: mask,
    maskImage: mask,
  };
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 bg-white z-10"
      style={style}
    />
  );
}
