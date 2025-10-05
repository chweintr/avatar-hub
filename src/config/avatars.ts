export type DockAvatar = {
  id: "brainstormer" | "tax" | "grants" | "crit";
  name: string;
  room: string;
  faceId?: string;
  agentId?: string;
  scale?: number;
};

export const AVATARS: DockAvatar[] = [
  {
    id: "tax",
    name: "Tax Advisor for Artists",
    room: "avatar-tax",
    faceId: "tmp8bjwedld",
    agentId: "d951e6dc-c098-43fb-a34f-e970cd339ea6",
    scale: 0.82
  },
  {
    id: "brainstormer",
    name: "Studio Brainstormer",
    room: "avatar-brain",
    faceId: "tmp8bjwedld",
    agentId: "d951e6dc-c098-43fb-a34f-e970cd339ea6",
    scale: 0.80
  },
  {
    id: "grants",
    name: "Grant / Residency Expert",
    room: "avatar-grants",
    faceId: "tmp8bjwedld",
    agentId: "d951e6dc-c098-43fb-a34f-e970cd339ea6",
    scale: 0.80
  },
  {
    id: "crit",
    name: "Crit Partner",
    room: "avatar-crit",
    faceId: "tmp8bjwedld",
    agentId: "d951e6dc-c098-43fb-a34f-e970cd339ea6",
    scale: 0.78
  }
];