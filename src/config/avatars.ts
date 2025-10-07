export type DockAvatar = {
  id: "brainstormer" | "tax" | "grants" | "crit";
  name: string;
  room: string;
  scale?: number;
};

export const AVATARS: DockAvatar[] = [
  {
    id: "tax",
    name: "Tax Advisor for Artists",
    room: "avatar-tax",
    scale: 0.82
  },
  {
    id: "grants",
    name: "Grant / Residency Expert",
    room: "avatar-grants",
    scale: 0.80
  },
  // Add these later when ready
  // {
  //   id: "brainstormer",
  //   name: "Studio Brainstormer",
  //   room: "avatar-brain",
  //   scale: 0.80
  // },
  // {
  //   id: "crit",
  //   name: "Crit Partner",
  //   room: "avatar-crit",
  //   scale: 0.78
  // }
];