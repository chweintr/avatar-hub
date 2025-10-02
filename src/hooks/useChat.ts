import { useState, useCallback, useRef } from 'react';
import { ChatMessage, TTSConfig } from '../types';
import { apiService } from '../services/api';

interface UseChatOptions {
  ttsConfig?: TTSConfig;
  systemPrompt?: string;
  onAudioGenerated?: (audio: ArrayBuffer) => void;
}

export const useChat = (options: UseChatOptions = {}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, { ...message, timestamp: Date.now() }]);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    try {
      setIsLoading(true);
      
      // Add user message
      const userMessage: ChatMessage = { role: 'user', content };
      addMessage(userMessage);

      // Prepare messages with system prompt
      const chatMessages = options.systemPrompt 
        ? [{ role: 'system' as const, content: options.systemPrompt }, ...messages, userMessage]
        : [...messages, userMessage];

      // Get AI response
      const response = await apiService.sendChatMessage(chatMessages);
      
      if (response.choices && response.choices[0]) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.choices[0].message.content
        };
        addMessage(assistantMessage);

        // Generate TTS if configured
        if (options.ttsConfig && options.onAudioGenerated) {
          try {
            const audioData = await apiService.generateSpeech(
              assistantMessage.content,
              options.ttsConfig.voiceId
            );
            options.onAudioGenerated(audioData);
          } catch (ttsError) {
            console.error('TTS generation failed:', ttsError);
            // Fallback to local TTS could be implemented here
          }
        }

        return assistantMessage;
      }
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [messages, options, addMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    addMessage,
    clearMessages,
    stopGeneration
  };
};