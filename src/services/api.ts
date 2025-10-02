import axios from 'axios';
import { ChatMessage } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const apiService = {
  // Simli API
  getSimliToken: async (faceId: string) => {
    const response = await api.post('/api/simli/token', { faceId });
    return response.data;
  },

  // OpenAI Chat API
  sendChatMessage: async (messages: ChatMessage[], stream = false) => {
    const response = await api.post('/api/openai/chat', { messages, stream });
    return response.data;
  },

  // ElevenLabs TTS
  generateSpeech: async (text: string, voiceId?: string) => {
    const response = await api.post('/api/elevenlabs/tts', 
      { text, voiceId },
      { responseType: 'arraybuffer' }
    );
    return response.data;
  },

  // LiveKit Token
  getLiveKitToken: async (roomName: string, participantName: string) => {
    const response = await api.post('/api/livekit/token', { roomName, participantName });
    return response.data;
  }
};