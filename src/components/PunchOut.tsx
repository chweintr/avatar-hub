import React from "react";

// A white overlay with a circular hole so the backdrop shows through.
// Pointer-events none => clicks pass through the hole to the iframe.
export default function PunchOut({
  cx = "50%",
  cy = "40vh",
  r = "min(29vmin, 320px)",
}: {
  cx?: string;
  cy?: string;
  r?: string;
}) {
  const mask = `radial-gradient(circle at ${cx} ${cy}, transparent ${r}, white calc(${r} + 1px))`;
  return (
    <div
      aria-hidden
      className="fixed inset-0 bg-white z-[15] pointer-events-none"
      style={{ WebkitMaskImage: mask, maskImage: mask }}
    />
  );
}
