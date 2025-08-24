
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, MessageCircle, Share2, Trash2, Heart, Flag, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { OctopusButton } from "@/components/OctopusButton";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ReportContentModal } from "@/components/ReportContentModal";
import { AppealContentModal } from "@/components/AppealContentModal";
import { useVideoComments } from "@/hooks/useVideoComments";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VideoViewerProps {
  videos: Array<{
    id: string;
    user_id: string;
    title?: string;
    description?: string;
    video_url: string;
    profiles?: {
      username?: string;
      display_name?: string;
    };
    location?: string;
    moderation_status?: string;
    is_hidden?: boolean;
    removal_reason?: string;
  }>;
  initialIndex?: number;
  onBack: () => void;
  pageTitle?: string;
}

export const VideoViewer = ({ videos, initialIndex = 0, onBack, pageTitle }: VideoViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  const currentVideo = videos[currentIndex];
  const maxCommentLength = 100;
  
  const { 
    comments, 
    likes, 
    isLiked, 
    loading, 
    addComment, 
    toggleLike, 
    likesCount 
  } = useVideoComments(currentVideo?.id || '');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    // Reset comments view when video changes
    setShowComments(false);
    setComment("");
  }, [currentIndex]);

  const handleSwipe = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      if (currentIndex < videos.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Loop back to first video
        setCurrentIndex(0);
      }
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleVideoEnd = () => {
    // Auto-advance to next video
    handleSwipe('next');
  };

  const handleCommentSubmit = async () => {
    if (comment.trim()) {
      const success = await addComment(comment);
      if (success) {
        setComment("");
        toast({
          title: "Comment added!",
          duration: 2000,
        });
      } else {
        toast({
          title: "Failed to add comment",
          description: "Please try again",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  };

  const handleDeleteVideo = async () => {
    if (!currentUser || currentUser.id !== currentVideo.user_id) return;
    
    if (confirm("Are you sure you want to delete this video?")) {
      try {
        const { error } = await supabase
          .from('videos')
          .delete()
          .eq('id', currentVideo.id);
        
        if (error) throw error;
        
        toast({
          title: "Video deleted",
          duration: 2000,
        });
        
        // Go back or to next video
        onBack();
      } catch (error) {
        toast({
          title: "Failed to delete video",
          description: "Please try again",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  };

  // Touch/swipe handling
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = startX - endX;
      const diffY = startY - endY;
      
      // Only trigger swipe if horizontal movement is greater than vertical
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
          // Swipe left (next video)
          handleSwipe('next');
        } else {
          // Swipe right (previous video)
          handleSwipe('prev');
        }
      }
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [currentIndex, videos.length]);

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4 header-safe">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-white text-center flex-1">
            <div className="text-xl font-bold">
              {pageTitle || currentVideo.location || 'Unknown Location'}
            </div>
            <div className="text-sm text-white/80">
              {currentVideo.profiles?.display_name || currentVideo.profiles?.username || 'Unknown User'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentUser?.id === currentVideo.user_id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteVideo}
                className="text-white hover:bg-red-500/20"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
            
            {/* Report button - only show for other users' content */}
            {currentUser?.id !== currentVideo.user_id && (
              <ReportContentModal videoId={currentVideo.id}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-red-500/20"
                >
                  <Flag className="w-5 h-5" />
                </Button>
              </ReportContentModal>
            )}
            
            {/* Appeal button - only show for own content that's been flagged/hidden */}
            {currentUser?.id === currentVideo.user_id && 
             (currentVideo.moderation_status === 'flagged' || currentVideo.is_hidden) && (
              <AppealContentModal 
                videoId={currentVideo.id} 
                removalReason={currentVideo.removal_reason}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-blue-500/20"
                >
                  <MessageSquare className="w-5 h-5" />
                </Button>
              </AppealContentModal>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: currentVideo.title || 'Check out this video',
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  toast({
                    title: "Link copied to clipboard",
                    duration: 2000,
                  });
                }
              }}
              className="text-white hover:bg-white/20"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-black">
        <VideoPlayer
          videoUrl={currentVideo.video_url}
          onVideoEnd={handleVideoEnd}
          autoPlay={true}
          className="w-full h-full object-contain"
        />


        {/* Navigation arrows */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSwipe('prev')}
              className="text-white hover:bg-white/20 bg-black/20"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
          )}
        </div>
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSwipe('next')}
            className="text-white hover:bg-white/20 bg-black/20"
          >
            <ArrowLeft className="w-6 h-6 rotate-180" />
          </Button>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pb-safe-only">
        {/* Video Title and Description */}
        {(currentVideo.title || currentVideo.description) && (
          <div className="text-white mb-4">
            {currentVideo.title && (
              <p className="text-lg font-medium mb-1">{currentVideo.title}</p>
            )}
            {currentVideo.description && (
              <p className="text-sm text-white/80">{currentVideo.description}</p>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <OctopusButton 
                size="lg" 
                isLiked={isLiked}
                onLike={toggleLike}
              />
              <span className="text-white text-sm">{likesCount}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="text-white hover:bg-white/20"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="ml-1 text-sm">{comments.length}</span>
            </Button>
          </div>
          <div className="text-white text-sm">
            {currentIndex + 1} / {videos.length}
          </div>
        </div>

        {/* Comment Section */}
        {showComments && (
          <Card className="mb-4 max-h-80 flex flex-col">
            <CardContent className="p-4 flex-1 flex flex-col">
              {/* Comments List */}
              <div className="flex-1 overflow-y-auto mb-4 max-h-40">
                {loading ? (
                  <div className="text-muted-foreground text-sm">Loading comments...</div>
                ) : comments.length > 0 ? (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="text-sm">
                        <div className="font-medium text-foreground">
                          {comment.profiles?.display_name || comment.profiles?.username || 'Anonymous'}
                        </div>
                        <div className="text-muted-foreground">{comment.content}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">No comments yet. Be the first!</div>
                )}
              </div>
              
              {/* Comment Input */}
              <div className="flex items-end gap-2 border-t pt-3">
                <div className="flex-1">
                  <Textarea
                    placeholder="Add a thoughtful comment (max 100 characters)..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, maxCommentLength))}
                    className="min-h-20 resize-none border-velyar-earth/20 focus:border-velyar-earth"
                    maxLength={maxCommentLength}
                  />
                  <div className="text-xs text-muted-foreground mt-1 text-right">
                    {comment.length}/{maxCommentLength} characters
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
