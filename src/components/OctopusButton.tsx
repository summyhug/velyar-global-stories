
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface OctopusButtonProps {
  isLiked?: boolean;
  onLike?: () => void;
  size?: "sm" | "md" | "lg";
}

export const OctopusButton = ({ isLiked = false, onLike, size = "md" }: OctopusButtonProps) => {
  const [liked, setLiked] = useState(isLiked);

  const handleClick = () => {
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
      className={`${sizeClasses[size]} rounded-full ${liked ? 'bg-velyar-warm/20 text-velyar-earth' : 'bg-black/20 text-white hover:bg-black/40'} transition-all duration-300`}
      onClick={handleClick}
    >
      <img 
        src="/lovable-uploads/6e35e706-01c0-46b9-b5c6-8c50b1848687.png" 
        alt="Octopus" 
        className={`object-contain transition-transform duration-300 ${liked ? 'scale-110' : 'scale-100'} ${sizeClasses[size].includes('w-6') ? 'w-4 h-4' : sizeClasses[size].includes('w-8') ? 'w-6 h-6' : 'w-8 h-8'}`}
      />
    </Button>
  );
};
