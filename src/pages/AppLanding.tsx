import { useMemo, useState } from "react";
import StageLiveKit from "../components/StageLiveKit";
import StageDailyBot from "../components/StageDailyBot";
import { Dock } from "../components/Dock";
import { AVATARS } from "../config/avatars";
import NavBar from "../components/NavBar";
import AnimatedBackground from "../components/AnimatedBackground";
import GrainOverlay from "../components/GrainOverlay";

export default function AppLanding() {
  const [activeId, setActiveId] = useState<string | undefined>();
  const active = useMemo(() => AVATARS.find(a => a.id === activeId), [activeId]);

  return (
    <div className="relative min-h-screen">
      {/* Layer 0: Animated background */}
      <AnimatedBackground />

      {/* Layer 1: Grain overlay */}
      <GrainOverlay />

      {/* Nav bar */}
      <NavBar />

      {/* Main content */}
      <div className="relative z-[25] mx-auto max-w-6xl px-6 pt-20 pb-16">
        {/* Stage area */}
        <section className="mt-10 flex justify-center">
          {active ? (
            active.useDailyBot ? (
              <StageDailyBot
                faceId={active.id}
                scale={active.scale}
                config={active.systemPrompt ? [
                  {
                    service: "tts",
                    options: [{ name: "voice", value: active.voice || "79a125e8-cd45-4c13-8a67-188112f4dd22" }]
                  },
                  {
                    service: "llm",
                    options: [
                      { name: "initial_messages", value: [{
                        role: "user",
                        content: [{ type: "text", text: active.systemPrompt }]
                      }]}
                    ]
                  }
                ] : []}
              />
            ) : (
              <StageLiveKit roomName={active.room} />
            )
          ) : (
            <div
              className="rounded-full"
              style={{
                width: "min(58vmin, 640px)",
                height: "min(58vmin, 640px)",
                border: "2px solid rgba(255,255,255,.85)",
                background: "radial-gradient(60% 60% at 50% 40%, #111 0%, #000 60%)",
                boxShadow: "0 40px 120px rgba(0,0,0,0.10) inset",
              }}
            />
          )}
        </section>

        {/* Dock */}
        <section id="dock" className="relative mt-16 flex justify-center">
          <Dock
            avatars={AVATARS}
            activeId={activeId}
            onSelect={setActiveId}
          />
        </section>
      </div>
    </div>
  );
}
