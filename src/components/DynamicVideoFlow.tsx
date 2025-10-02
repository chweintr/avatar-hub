import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoState } from '../types';

interface DynamicVideoFlowProps {
  idleVideoSrc: string;
  transitionInVideoSrc?: string;
  transitionOutVideoSrc?: string;
  onTransitionComplete?: (state: VideoState) => void;
  className?: string;
}

export const DynamicVideoFlow: React.FC<DynamicVideoFlowProps> = ({
  idleVideoSrc,
  transitionInVideoSrc,
  transitionOutVideoSrc,
  onTransitionComplete,
  className = ''
}) => {
  const [videoState, setVideoState] = useState<VideoState>('idle');
  const [currentVideoSrc, setCurrentVideoSrc] = useState(idleVideoSrc);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoEnd = () => {
      switch (videoState) {
        case 'transition-in':
          setVideoState('interactive');
          onTransitionComplete?.('interactive');
          break;
        case 'transition-out':
          setVideoState('idle');
          setCurrentVideoSrc(idleVideoSrc);
          onTransitionComplete?.('idle');
          break;
        default:
          break;
      }
    };

    video.addEventListener('ended', handleVideoEnd);
    return () => video.removeEventListener('ended', handleVideoEnd);
  }, [videoState, idleVideoSrc, onTransitionComplete]);

  const transitionToInteractive = () => {
    if (transitionInVideoSrc && videoState === 'idle') {
      setVideoState('transition-in');
      setCurrentVideoSrc(transitionInVideoSrc);
    } else {
      setVideoState('interactive');
      onTransitionComplete?.('interactive');
    }
  };

  const transitionToIdle = () => {
    if (transitionOutVideoSrc && videoState === 'interactive') {
      setVideoState('transition-out');
      setCurrentVideoSrc(transitionOutVideoSrc);
    } else {
      setVideoState('idle');
      setCurrentVideoSrc(idleVideoSrc);
      onTransitionComplete?.('idle');
    }
  };

  return (
    <div className={`relative aspect-square ${className}`}>
      <AnimatePresence mode="wait">
        <motion.video
          key={currentVideoSrc}
          ref={videoRef}
          className="w-full h-full object-cover rounded-lg"
          src={currentVideoSrc}
          autoPlay
          muted
          loop={videoState === 'idle'}
          playsInline
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      </AnimatePresence>
      
      {/* Control buttons for testing */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        <button
          onClick={transitionToInteractive}
          disabled={videoState !== 'idle'}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          Start Interaction
        </button>
        <button
          onClick={transitionToIdle}
          disabled={videoState !== 'interactive'}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
        >
          End Interaction
        </button>
      </div>
    </div>
  );
};