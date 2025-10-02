import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoLayerConfig } from '../types';

interface LayeredVideoPlayerProps {
  bottomLayer: VideoLayerConfig;
  topLayer: VideoLayerConfig;
  children?: React.ReactNode;
  className?: string;
}

export const LayeredVideoPlayer: React.FC<LayeredVideoPlayerProps> = ({
  bottomLayer,
  topLayer,
  children,
  className = ''
}) => {
  const bottomVideoRef = useRef<HTMLVideoElement>(null);
  const topVideoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        if (bottomVideoRef.current && topVideoRef.current) {
          await Promise.all([
            bottomVideoRef.current.load(),
            topVideoRef.current.load()
          ]);
          
          // Start playing both videos
          bottomVideoRef.current.play().catch(console.error);
          topVideoRef.current.play().catch(console.error);
          
          setIsLoaded(true);
        }
      } catch (error) {
        console.error('Error loading videos:', error);
      }
    };

    loadVideos();
  }, [bottomLayer.src, topLayer.src]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Bottom particle layer */}
      <motion.video
        ref={bottomVideoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src={bottomLayer.src}
        loop={bottomLayer.loop ?? true}
        muted={bottomLayer.muted ?? true}
        playsInline
        style={{
          zIndex: bottomLayer.zIndex,
          opacity: bottomLayer.opacity ?? 1,
          mixBlendMode: 'screen' // For alpha blending
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? (bottomLayer.opacity ?? 1) : 0 }}
        transition={{ duration: 1 }}
      />
      
      {/* Central content (Simli avatar or video) */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 10 }}>
        {children}
      </div>
      
      {/* Top particle layer */}
      <motion.video
        ref={topVideoRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        src={topLayer.src}
        loop={topLayer.loop ?? true}
        muted={topLayer.muted ?? true}
        playsInline
        style={{
          zIndex: topLayer.zIndex,
          opacity: topLayer.opacity ?? 1,
          mixBlendMode: 'screen' // For alpha blending
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? (topLayer.opacity ?? 1) : 0 }}
        transition={{ duration: 1 }}
      />
    </div>
  );
};