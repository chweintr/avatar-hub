import { ReactNode } from "react";

export default function Portal({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative mx-auto select-none"
      style={{ width: "min(60vmin, 680px)", height: "min(60vmin, 680px)" }}
    >
      {/* Thick white ring + soft halo */}
      <div className="absolute inset-0 rounded-full"
           style={{
             boxShadow: `
               0 0 0 10px rgba(255,255,255,0.95),
               0 0 0 24px rgba(255,255,255,0.10),
               inset 0 20px 60px rgba(0,0,0,0.22),
               inset 0 -8px 20px rgba(255,255,255,0.35)
             `
           }}
      />

      {/* Cropped circular stage */}
      <div className="absolute inset-[12px] rounded-full overflow-hidden bg-[#0f0f10]">
        {children}
      </div>
    </div>
  );
}
