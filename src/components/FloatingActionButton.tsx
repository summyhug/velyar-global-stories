import { Plus, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import StoryCamera from "../../StoryCamera";

export const FloatingActionButton = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Reset recording state after a timeout (fallback for when user leaves camera)
  useEffect(() => {
    if (isRecording) {
      const timeout = setTimeout(() => {
        console.log('FloatingActionButton: Timeout reached, resetting recording state');
        setIsRecording(false);
      }, 10000); // Reset after 10 seconds

      return () => clearTimeout(timeout);
    }
  }, [isRecording]);

  const handleStoryCamera = async () => {
    try {
      console.log('🎬 ===== FLOATINGACTIONBUTTON: STARTING STORYCAMERA =====');
      
      setIsRecording(true);
      
      const storyResult = await StoryCamera.recordVideo({
        duration: 30,
        camera: 'rear',
        allowOverlays: true
      });
      
      console.log('✅ ===== FLOATINGACTIONBUTTON: STORYCAMERA SUCCESS =====');
      console.log('FloatingActionButton StoryCamera result:', storyResult);
      
    } catch (error) {
      console.error('❌ ===== FLOATINGACTIONBUTTON: STORYCAMERA FAILED =====');
      console.error('FloatingActionButton StoryCamera error:', error.message);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="fab fixed bottom-20 right-4 z-50 pb-safe pr-safe">
      <Button
        size="lg"
        className="w-14 h-14 rounded-full bg-velyar-earth hover:bg-velyar-warm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleStoryCamera}
        disabled={isRecording}
      >
        {isRecording ? (
          <Video className="w-6 h-6 animate-pulse" />
        ) : isHovered ? (
          <Video className="w-6 h-6 animate-pulse" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </Button>
      
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
