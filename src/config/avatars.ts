export type DockAvatar = {
  id: "brainstormer" | "tax" | "grants" | "crit";
  name: string;
  room: string;
  useSimli?: boolean;  // If true, use Simli; face/agent IDs come from server
  scale?: number;
};

export const AVATARS: DockAvatar[] = [
  {
    id: "tax",
    name: "Tax Advisor for Artists",
    room: "avatar-tax",
    useSimli: true,
    scale: 0.82
  },
  {
    id: "brainstormer",
    name: "Studio Brainstormer",
    room: "avatar-brain",
    useSimli: true,
    scale: 0.80
  },
  {
    id: "grants",
    name: "Grant / Residency Expert",
    room: "avatar-grants",
    useSimli: true,
    scale: 0.80
  },
  {
    id: "crit",
    name: "Crit Partner",
    room: "avatar-crit",
    useSimli: true,
    scale: 0.78
  }
];