import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayeredVideoPlayer } from './LayeredVideoPlayer';
import { DynamicVideoFlow } from './DynamicVideoFlow';
import { SimliAvatar } from './SimliAvatar';
import { Avatar, VideoState, SimliConfig } from '../types';

// Avatar configurations with actual IDs
const MOCK_AVATARS: Avatar[] = [
  {
    id: 'tax-specialist',
    name: 'Tax Advisor',
    thumbnail: '/avatars/tax-specialist-thumb.jpg',
    description: 'Expert tax guidance for creative professionals',
    agentType: 'tax-specialist',
    provider: 'simli',
    providerConfig: {
      faceId: 'afdb6a3e-3939-40aa-92df-01604c23101c', // Your provided Simli face ID
      agentId: 'd951e6dc-c098-43fb-a34f-e970cd339ea6' // Your tax advisor agent ID (knowledge base)
    },
    systemPrompt: `You are a specialized tax advisor for artists and creative professionals. 
    Help with tax deductions, self-employment taxes, quarterly payments, and record keeping.
    Always remind users to consult with a licensed tax professional for their specific situation.`
  },
  {
    id: 'creative-consultant',
    name: 'Creative Strategist',
    thumbnail: '/avatars/creative-consultant-thumb.jpg',
    description: 'Portfolio development & career strategy',
    agentType: 'creative-consultant',
    provider: 'simli', // Can be changed to 'heygen' later
    providerConfig: {
      faceId: 'placeholder-face-id' // Replace with actual ID
    },
    systemPrompt: 'You are a creative consultant helping artists with portfolio development and career strategy.'
  },
  {
    id: 'general-assistant',
    name: 'AI Assistant',
    thumbnail: '/avatars/general-assistant-thumb.jpg',
    description: 'General purpose helper',
    agentType: 'general',
    provider: 'heygen', // Example of using different provider
    providerConfig: {
      avatarId: 'placeholder-avatar-id' // HeyGen uses avatarId instead
    }
  }
];

export const AvatarHub: React.FC = () => {
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [videoState, setVideoState] = useState<VideoState>('idle');
  const [simliConfig, setSimliConfig] = useState<SimliConfig | null>(null);
  const [showSimli, setShowSimli] = useState(false);

  // Fetch Simli configuration from backend
  const fetchSimliConfig = useCallback(async (faceId: string) => {
    try {
      const response = await fetch('/api/simli/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faceId })
      });
      
      const data = await response.json();
      if (data.success) {
        setSimliConfig(data.config);
      }
    } catch (error) {
      console.error('Failed to fetch Simli config:', error);
    }
  }, []);

  // Handle avatar selection
  const handleAvatarSelect = useCallback((avatar: Avatar) => {
    setSelectedAvatar(avatar);
    fetchSimliConfig(avatar.faceId);
  }, [fetchSimliConfig]);

  // Handle video state transitions
  const handleTransitionComplete = useCallback((newState: VideoState) => {
    setVideoState(newState);
    if (newState === 'interactive') {
      setShowSimli(true);
    } else if (newState === 'idle') {
      setShowSimli(false);
      setSelectedAvatar(null);
      setSimliConfig(null);
    }
  }, []);

  // Handle ending interaction
  const handleEndInteraction = useCallback(() => {
    setShowSimli(false);
    // This will trigger the transition-out video
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <LayeredVideoPlayer
        bottomLayer={{
          src: '/videos/particles-bottom.webm',
          zIndex: 1,
          opacity: 0.7,
          loop: true,
          muted: true
        }}
        topLayer={{
          src: '/videos/particles-top.webm',
          zIndex: 20,
          opacity: 0.5,
          loop: true,
          muted: true
        }}
        className="fixed inset-0"
      >
        {/* Central Mount - Square Format */}
        <div className="max-w-2xl w-full aspect-square">
          <AnimatePresence mode="wait">
            {!showSimli ? (
              <DynamicVideoFlow
                key="video-flow"
                idleVideoSrc="/videos/idle-state.mp4"
                transitionInVideoSrc={selectedAvatar ? `/videos/transition-in-${selectedAvatar.id}.mp4` : undefined}
                transitionOutVideoSrc={selectedAvatar ? `/videos/transition-out-${selectedAvatar.id}.mp4` : undefined}
                onTransitionComplete={handleTransitionComplete}
                className="w-full h-full"
              />
            ) : (
              simliConfig && (
                <SimliAvatar
                  key="simli-avatar"
                  config={simliConfig}
                  onReady={() => console.log('Simli ready')}
                  onError={(error) => console.error('Simli error:', error)}
                  className="w-full h-full"
                />
              )
            )}
          </AnimatePresence>
          
          {/* End Call Button */}
          {showSimli && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
              onClick={handleEndInteraction}
            >
              End Interaction
            </motion.button>
          )}
        </div>
      </LayeredVideoPlayer>
      
      {/* Avatar Selection UI */}
      {videoState === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black to-transparent"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Avatar</h2>
          <div className="flex justify-center gap-6 max-w-4xl mx-auto">
            {MOCK_AVATARS.map((avatar) => (
              <motion.button
                key={avatar.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative"
                onClick={() => handleAvatarSelect(avatar)}
              >
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-transparent group-hover:border-white transition-colors">
                  <img
                    src={avatar.thumbnail}
                    alt={avatar.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-2 text-center">
                  <h3 className="font-medium">{avatar.name}</h3>
                  <p className="text-sm text-gray-400">{avatar.description}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};