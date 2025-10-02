import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarProvider } from '../types';
import { SimliAvatar } from './SimliAvatar';
// import { HeyGenAvatar } from './HeyGenAvatar'; // To be implemented

interface GenericAvatarProps {
  avatar: Avatar;
  onReady?: () => void;
  onError?: (error: Error) => void;
  onSpeaking?: (isSpeaking: boolean) => void;
  className?: string;
}

export const GenericAvatar: React.FC<GenericAvatarProps> = ({
  avatar,
  onReady,
  onError,
  onSpeaking,
  className = ''
}) => {
  // Provider-specific rendering
  const renderAvatar = () => {
    switch (avatar.provider) {
      case 'simli':
        if (!avatar.providerConfig.faceId) {
          onError?.(new Error('Simli faceId is required'));
          return null;
        }
        return (
          <SimliAvatar
            config={{
              apiKey: '', // Will be fetched from backend
              faceId: avatar.providerConfig.faceId
            }}
            onReady={onReady}
            onError={onError}
            onSpeaking={onSpeaking}
            className={className}
          />
        );
      
      case 'heygen':
        // Placeholder for HeyGen implementation
        return (
          <div className={`${className} flex items-center justify-center bg-gray-900 rounded-lg`}>
            <p className="text-white">HeyGen Avatar (Coming Soon)</p>
          </div>
        );
      
      case 'custom':
        return (
          <div className={`${className} flex items-center justify-center bg-gray-900 rounded-lg`}>
            <p className="text-white">Custom Avatar Provider</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`avatar-container ${className}`}>
      {/* Your branded wrapper - no provider branding visible */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full h-full"
      >
        {renderAvatar()}
        
        {/* Your custom branding overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="text-center">
            <h3 className="text-white font-medium">{avatar.name}</h3>
            <p className="text-gray-300 text-sm">{avatar.description}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};