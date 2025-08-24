import { Plus, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";

export const FloatingActionButton = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fab fixed bottom-20 right-4 z-50 pb-safe pr-safe">
      <Link to="/create">
        <Button
          size="lg"
          className="w-14 h-14 rounded-full bg-velyar-earth hover:bg-velyar-warm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isHovered ? (
            <Video className="w-6 h-6 animate-pulse" />
          ) : (
            <Plus className="w-6 h-6" />
          )}
        </Button>
      </Link>
      
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-16 right-0 bg-foreground text-background px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg animate-in fade-in-0 slide-in-from-bottom-2">
          Record your story
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-foreground" />
        </div>
      )}
    </div>
  );
};
