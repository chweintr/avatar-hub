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
    simliUrl: "/simli-agent.html?id=brainstormer&faceId=TODO&agentId=TODO&scale=0.82"
  },
  {
    id: "tax",
    name: "Tax Advisor for Artists",
    simliUrl: `/simli-agent.html?id=tax&faceId=afdb6a3e-3939-40aa-92df-01604c23101c&agentId=d951e6dc-c098-43fb-a34f-e970cd339ea6&scale=0.80`
  },
  {
    id: "grants",
    name: "Grant / Residency Expert",
    simliUrl: `/simli-rag-agent.html?id=grants&faceId=cace3ef7-a4c4-425d-a8cf-a5358eb0c427&useRag=true&scale=0.80`
  },
  {
    id: "crit",
    name: "Crit Partner",
    simliUrl: "/simli-agent.html?id=crit&faceId=TODO&agentId=TODO&scale=0.78"
  }
];