export type Provider = "livekit_simli" | "livekit_custom";

export type DockAvatar = {
  id: "brainstormer" | "tax" | "grants" | "crit";
  name: string;
  provider: Provider;
  room: string;
  thumbnail?: string;
  scale?: number;
};

export const AVATARS: DockAvatar[] = [
  {
    id: "tax",
    name: "Tax Advisor for Artists",
    provider: "livekit_simli",
    room: "avatar-tax",
    scale: 0.82
  },
  {
    id: "brainstormer",
    name: "Studio Brainstormer",
    provider: "livekit_simli",
    room: "avatar-brain",
    scale: 0.80
  },
  {
    id: "grants",
    name: "Grant / Residency Expert",
    provider: "livekit_custom",
    room: "avatar-grants",
    scale: 0.80
  },
  {
    id: "crit",
    name: "Crit Partner",
    provider: "livekit_custom",
    room: "avatar-crit",
    scale: 0.78
  }
];