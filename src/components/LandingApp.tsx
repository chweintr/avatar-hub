import { useState } from "react";
import StageCircle from "./StageCircle";
import { Dock, DockAvatar } from "./Dock";
import { FogBackground } from "./FogBackground";

const STUDIO_AVATARS: DockAvatar[] = [
  { 
    id: "monika", 
    name: "Monika — Tax Advisor for Artists", 
    thumbnail: "/avatars/tax-specialist-thumb.jpg",
    provider: 'simli',
    simliUrl: `${window.location.origin}/simli-agent?id=tax-specialist&faceId=afdb6a3e-3939-40aa-92df-01604c23101c&agentId=d951e6dc-c098-43fb-a34f-e970cd339ea6`
  },
  { 
    id: "grant-advisor", 
    name: "Grant & Residency Advisor", 
    disabled: true 
  },
  { 
    id: "art-historian", 
    name: "Art Historian & Context Librarian", 
    disabled: true 
  },
  { 
    id: "crit-partner", 
    name: "Crit Partner (Multimodal)", 
    disabled: true 
  },
  { 
    id: "brainstorm", 
    name: "Brainstorming Partner", 
    disabled: true 
  },
  { 
    id: "gallery-liaison", 
    name: "Gallery Liaison & Comms", 
    disabled: true 
  },
  { 
    id: "documentation", 
    name: "Documentation & Metadata Assistant", 
    disabled: true 
  },
  { 
    id: "pricing-coach", 
    name: "Pricing & Editioning Coach", 
    disabled: true 
  },
  { 
    id: "logistics", 
    name: "Studio Logistics Manager", 
    disabled: true 
  },
];

export default function LandingApp() {
  const [active, setActive] = useState<DockAvatar | undefined>();

  return (
    <div className="min-h-screen bg-white text-neutral-900 relative overflow-hidden">
      <FogBackground />
      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-8 pb-16">
        {/* header pill */}
        <div className="flex items-center justify-between rounded-full bg-neutral-900/[.04] border border-neutral-900/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-gradient-to-br from-pink-200 to-cyan-200" />
            <span className="text-sm font-medium tracking-tight text-neutral-700">Avatar Hub</span>
          </div>
          <nav className="hidden sm:flex items-center gap-5 text-sm text-neutral-600">
            <a href="#dock" className="hover:opacity-70">Studio Agents</a>
            <a href="/projection" className="hover:opacity-70">Projection Mode</a>
            <a href="/settings" className="hover:opacity-70">Settings</a>
          </nav>
        </div>

        {/* stage */}
        <div className="mt-10 flex justify-center">
          <StageCircle
            mode={active?.simliUrl ? "simli" : active?.heygenUrl ? "heygen" : active ? "media" : "empty"}
            simliUrl={active?.simliUrl}
            heygenUrl={active?.heygenUrl}
            posterSrc={active?.thumbnail}
            onDismiss={() => setActive(undefined)}
          />
        </div>

        {/* dock */}
        <div id="dock" className="mt-10 flex justify-center">
          <Dock avatars={STUDIO_AVATARS} activeId={active?.id} onSelect={setActive} />
        </div>
      </div>
    </div>
  );
}