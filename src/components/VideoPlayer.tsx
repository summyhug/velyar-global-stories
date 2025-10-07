import { useRef, useEffect, forwardRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
  onVideoEnd?: () => void;
  autoPlay?: boolean;
  className?: string;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(({ 
  videoUrl, 
  onVideoEnd, 
  autoPlay = true, 
  className = "" 
}, forwardedRef) => {
  const internalRef = useRef<HTMLVideoElement>(null);
  const videoRef = internalRef;
  
  // Forward the ref
  useEffect(() => {
    if (typeof forwardedRef === 'function') {
      forwardedRef(internalRef.current);
    } else if (forwardedRef) {
      forwardedRef.current = internalRef.current;
    }
  }, [forwardedRef]);
  
  // Load mute preference from localStorage (global setting)
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('videoPlayer_muted');
    return saved === 'true';
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      onVideoEnd?.();
    };

    video.addEventListener('ended', handleEnded);
    
    // Apply global mute preference
    video.muted = isMuted;
    
    if (autoPlay) {
      video.play().catch(console.error);
    }

    return () => {
      video.removeEventListener('ended', handleEnded);
      // Pause video and reset when component unmounts or videoUrl changes
      video.pause();
      video.currentTime = 0;
    };
  }, [videoUrl, onVideoEnd, autoPlay, isMuted]);

  const toggleMute = async (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const video = videoRef.current;
    if (video) {
      const newMutedState = !video.muted;
      
      // Pause the video first
      const wasPlaying = !video.paused;
      if (wasPlaying) {
        video.pause();
      }
      
      // Change mute state and save to localStorage for ALL videos
      video.muted = newMutedState;
      setIsMuted(newMutedState);
      localStorage.setItem('videoPlayer_muted', newMutedState.toString());
      
      // Resume playing if it was playing before
      if (wasPlaying) {
        try {
          await video.play();
        } catch (err) {
          console.error('Error resuming playback:', err);
        }
      }
      
      console.log('Video muted state (GLOBAL) changed to:', newMutedState, 'Audio enabled:', !newMutedState);
    }
  };

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={videoUrl}
        className={`w-full h-full ${className}`}
        controls={false}
        playsInline
        muted={false} // Audio enabled by default
        autoPlay={autoPlay}
        preload="metadata"
        onError={(e) => {
          console.error('Video playback error:', e);
        }}
      />
      
      {/* Mute/Unmute button - positioned above video counter at bottom */}
      <button
        onClick={toggleMute}
        onTouchEnd={toggleMute}
        className="absolute bottom-20 right-4 p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors z-50 shadow-lg"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
      </button>
    </div>
  );
});