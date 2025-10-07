export type DockAvatar = {
  id: "brainstormer" | "tax" | "grants" | "crit";
  name: string;
  room: string;
  scale?: number;
  thumbnail?: string;
  thumbVideo?: string;
  thumbMp4?: string;  // Looped video thumbnail
};

export const AVATARS: DockAvatar[] = [
  {
    id: "tax",
    name: "Tax Advisor for Artists",
    room: "avatar-tax",
    scale: 0.82,
    thumbVideo: "/agents/tax-specialist/afdb6a3e-3939-40aa-92df-01604c23101c.mp4",
    thumbMp4: "/agents/tax-specialist/afdb6a3e-3939-40aa-92df-01604c23101c.mp4"
  },
  {
    id: "grants",
    name: "Grant / Residency Expert",
    room: "avatar-grants",
    scale: 0.80,
    thumbVideo: "/agents/grant-specialist/requirements.mp4",
    thumbMp4: "/agents/grant-specialist/requirements.mp4"
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