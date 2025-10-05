import React from "react";

// A white overlay with a circular hole so the backdrop shows through.
// The center circle allows pointer events through to the iframe below.
export default function PunchOut({
  cx = "50%",
  cy = "40vh", // vertical center of the hole
  r = "min(29vmin, 320px)", // radius of the hole
}: {
  cx?: string;
  cy?: string;
  r?: string;
}) {
  const mask = `radial-gradient(circle at ${cx} ${cy}, transparent ${r}, white calc(${r} + 1px))`;
  const style: React.CSSProperties = {
    WebkitMaskImage: mask,
    maskImage: mask,
    zIndex: 15,
    pointerEvents: "auto", // Enable pointer events on the white area
  };

  // Inline style to punch through pointer events in the center
  const centerStyle: React.CSSProperties = {
    position: "absolute",
    left: `calc(${cx} - ${r})`,
    top: `calc(${cy} - ${r})`,
    width: `calc(${r} * 2)`,
    height: `calc(${r} * 2)`,
    borderRadius: "50%",
    pointerEvents: "none", // Allow clicks through the center circle
    zIndex: 16,
  };

  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 bg-white"
        style={style}
      />
      <div
        aria-hidden
        style={centerStyle}
      />
    </>
  );
}
