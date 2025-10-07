export type DockAvatar = {
  id: "brainstormer" | "tax" | "grants" | "crit";
  name: string;
  provider: "simli" | "livekit";  // simli = browser SDK, livekit = worker
  // Simli provider fields
  faceId?: string;
  agentId?: string;
  // LiveKit provider fields
  room?: string;
  // Common
  scale?: number;
};

export const AVATARS: DockAvatar[] = [
  {
    id: "tax",
    name: "Tax Advisor for Artists",
    provider: "livekit",
    room: "avatar-tax",
    scale: 0.82
  },
  {
    id: "brainstormer",
    name: "Studio Brainstormer",
    provider: "simli",
    faceId: "afdb6a3e-3939-40aa-92df-01604c23101c",
    agentId: "your-brainstormer-agent-id",  // TODO: Get from Simli dashboard
    scale: 0.80
  },
  {
    id: "grants",
    name: "Grant / Residency Expert",
    provider: "livekit",
    room: "avatar-grants",
    scale: 0.80
  },
  {
    id: "crit",
    name: "Crit Partner",
    provider: "simli",
    faceId: "afdb6a3e-3939-40aa-92df-01604c23101c",
    agentId: "your-crit-agent-id",  // TODO: Get from Simli dashboard
    scale: 0.78
  }
];