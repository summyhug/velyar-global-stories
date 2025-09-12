
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface OctopusButtonProps {
  isLiked?: boolean;
  onLike?: () => void;
  size?: "sm" | "md" | "lg";
}

export const OctopusButton = ({ isLiked = false, onLike, size = "md" }: OctopusButtonProps) => {
  const [liked, setLiked] = useState(isLiked);
  const [isPressed, setIsPressed] = useState(false);

  // Sync internal state with prop changes (when switching videos)
  useEffect(() => {
    setLiked(isLiked);
    // Reset pressed state when switching videos
    setIsPressed(false);
  }, [isLiked]);

  const handleClick = () => {
    // Show temporary highlight effect
    setIsPressed(true);
    
    // Reset highlight after 500ms (shorter duration)
    setTimeout(() => {
      setIsPressed(false);
    }, 500);
    
    // Toggle the actual like state
    setLiked(!liked);
    onLike?.();
  };

  const sizeClasses = {
    sm: "w-6 h-6 text-lg",
    md: "w-8 h-8 text-xl",
    lg: "w-10 h-10 text-2xl"
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`${sizeClasses[size]} rounded-full ${
        isPressed 
          ? 'bg-velyar-warm/30 text-velyar-earth scale-110' 
          : liked 
            ? 'bg-velyar-warm/20 text-velyar-earth' 
            : 'bg-white/20 text-white hover:bg-white/40'
      } transition-all duration-300`}
      onClick={handleClick}
    >
      <img 
        src="/lovable-uploads/6e35e706-01c0-46b9-b5c6-8c50b1848687.png" 
        alt="Octopus" 
        className={`object-contain transition-all duration-300 ${
          isPressed 
            ? 'scale-125 brightness-110' 
            : liked 
              ? 'scale-110' 
              : 'scale-100 brightness-0 saturate-100 invert'
        } ${sizeClasses[size].includes('w-6') ? 'w-4 h-4' : sizeClasses[size].includes('w-8') ? 'w-6 h-6' : 'w-8 h-8'}`}
      />
    </Button>
  );
};
