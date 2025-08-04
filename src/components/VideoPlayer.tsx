import { useRef, useEffect } from "react";

interface VideoPlayerProps {
  videoUrl: string;
  onVideoEnd?: () => void;
  autoPlay?: boolean;
  className?: string;
}

export const VideoPlayer = ({ 
  videoUrl, 
  onVideoEnd, 
  autoPlay = true, 
  className = "" 
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      onVideoEnd?.();
    };

    video.addEventListener('ended', handleEnded);
    
    if (autoPlay) {
      video.play().catch(console.error);
    }

    return () => {
      video.removeEventListener('ended', handleEnded);
      // Pause video and reset when component unmounts or videoUrl changes
      video.pause();
      video.currentTime = 0;
    };
  }, [videoUrl, onVideoEnd, autoPlay]);

  return (
    <video
      ref={videoRef}
      src={videoUrl}
      className={`w-full h-full ${className}`}
      controls={false}
      playsInline
      muted={false}
      autoPlay={autoPlay}
      preload="metadata"
      onError={(e) => {
        console.error('Video playback error:', e);
      }}
    />
  );
};