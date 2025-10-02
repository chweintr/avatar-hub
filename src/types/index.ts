export type AvatarProvider = 'simli' | 'heygen' | 'custom';

export interface Avatar {
  id: string;
  name: string;
  thumbnail: string;
  description?: string;
  agentType?: 'general' | 'tax-specialist' | 'creative-consultant';
  systemPrompt?: string;
  provider: AvatarProvider;
  providerConfig: {
    faceId?: string;  // Simli face ID (visual appearance)
    agentId?: string; // Simli agent ID (knowledge base/personality)
    avatarId?: string; // HeyGen avatar ID
    customConfig?: any; // For future providers
  };
}

export type VideoState = 'idle' | 'transition-in' | 'interactive' | 'transition-out';

export interface VideoLayerConfig {
  src: string;
  zIndex: number;
  opacity?: number;
  loop?: boolean;
  muted?: boolean;
}

export interface SimliConfig {
  apiKey: string;
  faceId: string;
  agentId?: string; // Optional agent ID for knowledge base
}

export interface HeyGenConfig {
  apiKey: string;
  avatarId: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface TTSConfig {
  provider: 'elevenlabs' | 'local';
  voiceId?: string;
  settings?: {
    stability?: number;
    similarity_boost?: number;
  };
}