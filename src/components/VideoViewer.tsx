
import { useState } from "react";
import { ArrowLeft, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { OctopusButton } from "@/components/OctopusButton";

interface VideoViewerProps {
  videos: Array<{
    id: string;
    author: string;
    country: string;
    videoUrl: string;
    caption?: string;
  }>;
  initialIndex?: number;
  onBack: () => void;
}

export const VideoViewer = ({ videos, initialIndex = 0, onBack }: VideoViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");

  const currentVideo = videos[currentIndex];
  const maxCommentLength = 100;

  const handleSwipe = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleCommentSubmit = () => {
    if (comment.trim()) {
      // Handle comment submission
      console.log('Comment submitted:', comment);
      setComment("");
      setShowComments(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-white text-center">
            <div className="font-medium font-nunito">{currentVideo.author}</div>
            <div className="text-sm text-white/80">{currentVideo.country}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-black">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center mb-4">
              <span className="text-4xl">📹</span>
            </div>
            <p className="text-sm">Video player would be here</p>
          </div>
        </div>

        {/* Navigation arrows */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSwipe('prev')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
          )}
        </div>
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
          {currentIndex < videos.length - 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSwipe('next')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-6 h-6 rotate-180" />
            </Button>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <OctopusButton size="lg" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="text-white hover:bg-white/20"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
          </div>
          <div className="text-white text-sm">
            {currentIndex + 1} / {videos.length}
          </div>
        </div>

        {/* Comment Section */}
        {showComments && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Textarea
                    placeholder="Add a thoughtful comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, maxCommentLength))}
                    className="min-h-20 resize-none border-velyar-earth/20 focus:border-velyar-earth"
                  />
                  <div className="text-xs text-muted-foreground mt-1 text-right">
                    {comment.length}/{maxCommentLength}
                  </div>
                </div>
                <Button
                  onClick={handleCommentSubmit}
                  disabled={!comment.trim()}
                  className="bg-velyar-warm hover:bg-velyar-glow text-velyar-earth"
                >
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
