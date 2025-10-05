export type DockAvatar = {
  id: "brainstormer" | "tax" | "grants" | "crit";
  name: string;
  thumbnail?: string;
  faceId: string;
  agentId?: string;
  scale?: number;
};

export const AVATARS: DockAvatar[] = [
  {
    id: "brainstormer",
    name: "Studio Brainstormer",
    faceId: "TODO",
    agentId: "TODO",
    scale: 0.80
  },
  {
    id: "tax",
    name: "Tax Advisor for Artists",
    faceId: "afdb6a3e-3939-40aa-92df-01604c23101c",
    agentId: "d951e6dc-c098-43fb-a34f-e970cd339ea6",
    scale: 0.82
  },
  {
    id: "grants",
    name: "Grant / Residency Expert",
    faceId: "cace3ef7-a4c4-425d-a8cf-a5358eb0c427",
    scale: 0.80
  },
  {
    id: "crit",
    name: "Crit Partner",
    faceId: "TODO",
    agentId: "TODO",
    scale: 0.78
  }
];