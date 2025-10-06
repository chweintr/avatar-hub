import { RTVIClientConfigOption } from "realtime-ai";

export type DockAvatar = {
  id: "brainstormer" | "tax" | "grants" | "crit";
  name: string;
  room: string;
  useDailyBot?: boolean;  // If true, use Daily Bot + Simli pipeline
  systemPrompt?: string;
  voice?: string;  // Cartesia voice ID
  scale?: number;
};

export const AVATARS: DockAvatar[] = [
  {
    id: "tax",
    name: "Tax Advisor for Artists",
    room: "avatar-tax",
    useDailyBot: true,
    systemPrompt: "You are a knowledgeable tax advisor specializing in helping artists, creatives, and freelancers with their tax questions. Provide clear, practical advice.",
    voice: "79a125e8-cd45-4c13-8a67-188112f4dd22",  // Cartesia voice
    scale: 0.82
  },
  {
    id: "brainstormer",
    name: "Studio Brainstormer",
    room: "avatar-brain",
    useDailyBot: true,
    systemPrompt: "You are a creative brainstorming partner for artists. Help them develop ideas, overcome creative blocks, and explore new artistic directions.",
    voice: "79a125e8-cd45-4c13-8a67-188112f4dd22",
    scale: 0.80
  },
  {
    id: "grants",
    name: "Grant / Residency Expert",
    room: "avatar-grants",
    useDailyBot: true,
    systemPrompt: "You are an expert in artist grants, residencies, and funding opportunities. Help artists find and apply for opportunities that match their work.",
    voice: "79a125e8-cd45-4c13-8a67-188112f4dd22",
    scale: 0.80
  },
  {
    id: "crit",
    name: "Crit Partner",
    room: "avatar-crit",
    useDailyBot: true,
    systemPrompt: "You are a thoughtful art critic providing constructive feedback. Help artists analyze their work, consider different perspectives, and refine their practice.",
    voice: "79a125e8-cd45-4c13-8a67-188112f4dd22",
    scale: 0.78
  }
];