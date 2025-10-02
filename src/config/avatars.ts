export type DockAvatar = {
  id: "brainstormer" | "tax" | "grants" | "crit";
  name: string;          // user-facing label
  thumbnail?: string;    // idle image
  simliUrl: string;      // Simli embed URL
  description?: string;  // optional one-line description
};

export const AVATARS: DockAvatar[] = [
  { 
    id: "brainstormer", 
    name: "Studio Brainstormer",       
    thumbnail: "/thumbs/brainstormer.jpg", 
    simliUrl: "/simli/brainstormer",
    description: "Creative ideation and concept development"
  },
  { 
    id: "tax",          
    name: "Tax Advisor for Artists",   
    thumbnail: "/thumbs/tax.jpg",          
    simliUrl: `${window.location.origin}/simli-agent.html?id=tax&faceId=afdb6a3e-3939-40aa-92df-01604c23101c&agentId=d951e6dc-c098-43fb-a34f-e970cd339ea6`,
    description: "Deductions, quarterly taxes, and artist-specific guidance"
  },
  { 
    id: "grants",       
    name: "Grant / Residency Expert",  
    thumbnail: "/thumbs/grants.jpg",       
    simliUrl: "/simli/grants",
    description: "Application strategy and eligibility assessment"
  },
  { 
    id: "crit",         
    name: "Crit Partner",              
    thumbnail: "/thumbs/crit.jpg",         
    simliUrl: "/simli/crit",
    description: "Constructive feedback on work-in-progress"
  }
];