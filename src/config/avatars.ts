export type DockAvatar = {
  id: "brainstormer" | "tax" | "grants" | "crit";
  name: string;
  thumbnail?: string;
  simliUrl: string;
};

export const AVATARS: DockAvatar[] = [
  {
    id: "brainstormer",
    name: "Studio Brainstormer",
    simliUrl: "/simli/brainstormer"
  },
  {
    id: "tax",
    name: "Tax Advisor for Artists",
    simliUrl: `${window.location.origin}/simli-agent.html?id=tax&faceId=afdb6a3e-3939-40aa-92df-01604c23101c&agentId=d951e6dc-c098-43fb-a34f-e970cd339ea6`
  },
  {
    id: "grants",
    name: "Grant / Residency Expert",
    simliUrl: `${window.location.origin}/simli-rag-agent.html?id=grants&faceId=cace3ef7-a4c4-425d-a8cf-a5358eb0c427&useRag=true`
  },
  {
    id: "crit",
    name: "Crit Partner",
    simliUrl: "/simli/crit"
  }
];