import React, { useEffect, useRef, useState } from 'react';
import { SimliClient } from 'simli-client';
import { motion } from 'framer-motion';
import { SimliConfig } from '../types';

interface SimliAvatarProps {
  config: SimliConfig;
  onReady?: () => void;
  onError?: (error: Error) => void;
  onSpeaking?: (isSpeaking: boolean) => void;
  className?: string;
}

export const SimliAvatar: React.FC<SimliAvatarProps> = ({
  config,
  onReady,
  onError,
  onSpeaking,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [simliClient, setSimliClient] = useState<SimliClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const initializeSimli = async () => {
      try {
        const client = new SimliClient();
        
        // Initialize with configuration
        await client.initialize({
          apiKey: config.apiKey,
          faceId: config.faceId,
          handleSilence: true,
          videoRef: videoRef.current!,
          audioRef: audioRef.current!
        });

        // Set up event listeners
        client.on('connected', () => {
          setIsConnected(true);
          onReady?.();
        });

        client.on('disconnected', () => {
          setIsConnected(false);
        });

        client.on('speaking', (speaking: boolean) => {
          setIsSpeaking(speaking);
          onSpeaking?.(speaking);
        });

        client.on('error', (error: Error) => {
          console.error('Simli error:', error);
          onError?.(error);
        });

        // Start the connection
        await client.start();
        
        setSimliClient(client);
      } catch (error) {
        console.error('Failed to initialize Simli:', error);
        onError?.(error as Error);
      }
    };

    if (config.apiKey && config.faceId) {
      initializeSimli();
    }

    return () => {
      if (simliClient) {
        simliClient.close();
      }
    };
  }, [config.apiKey, config.faceId]);

  const sendMessage = async (text: string) => {
    if (simliClient && isConnected) {
      try {
        await simliClient.sendText(text);
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  const sendAudioData = async (audioData: ArrayBuffer) => {
    if (simliClient && isConnected) {
      try {
        await simliClient.sendAudioData(audioData);
      } catch (error) {
        console.error('Failed to send audio:', error);
      }
    }
  };

  return (
    <motion.div 
      className={`relative aspect-square bg-black rounded-lg overflow-hidden ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted
      />
      <audio
        ref={audioRef}
        autoPlay
        playsInline
      />
      
      {/* Speaking indicator */}
      {isSpeaking && (
        <motion.div 
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-green-400 rounded-full"
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.1,
                  repeat: Infinity
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Connection status */}
      <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
    </motion.div>
  );
};