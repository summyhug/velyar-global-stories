
import { useState, useEffect } from "react";
import { VideoViewer } from "@/components/VideoViewer";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Videos = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [showVideoViewer, setShowVideoViewer] = useState(!!id);

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, [type, id]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('videos')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      // Filter based on type
      if (type === 'mission' && id) {
        query = query.eq('mission_id', id);
      } else if (type === 'daily-prompt' && id) {
        // First check if this is actually a video ID being passed as daily-prompt
        const { data: videoCheck } = await supabase
          .from('videos')
          .select('id')
          .eq('id', id)
          .single();
        
        if (videoCheck) {
          // It's a video ID, fetch all videos for navigation
          // Don't filter by daily_prompt_id
        } else {
          // It's actually a daily prompt ID
          query = query.eq('daily_prompt_id', id);
        }
      } else if (type === 'video' && id) {
        // For direct video access, fetch all videos but we'll find the specific one
        // This allows navigation between videos
      }

      const { data: videosData, error } = await query;

      if (error) throw error;

      // Fetch profile data for each video
      const videosWithProfiles = [];
      if (videosData) {
        for (const video of videosData) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('user_id', video.user_id)
            .single();
          
          videosWithProfiles.push({
            ...video,
            profiles: profileData
          });
        }
      }

      setVideos(videosWithProfiles);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation - must be before any conditional returns
  useEffect(() => {
    if (!id) {
      navigate(`/video-list/${type}`);
    }
  }, [id, type, navigate]);

  const handleBack = () => {
    if (type === 'daily-prompt' && videos.length > 0) {
      // For daily prompts, go back to video list view
      const dailyPromptId = videos.find(v => v.daily_prompt_id)?.daily_prompt_id;
      if (dailyPromptId) {
        navigate(`/video-list/daily-prompt/${dailyPromptId}`);
      } else {
        navigate('/');
      }
    } else if (type === 'mission' && videos.length > 0) {
      // For missions, go back to mission video list
      const missionId = videos.find(v => v.mission_id)?.mission_id;
      if (missionId) {
        navigate(`/video-list/mission/${missionId}`);
      } else {
        navigate('/missions');
      }
    } else if (type && videos.length > 0) {
      // For other types, go back to the video list
      navigate(`/video-list/${type}`);
    } else {
      // If no type info, go back to previous page
      navigate(-1);
    }
  };

  // Show loading while fetching videos
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading video...</div>
      </div>
    );
  }

  // Handle case when we have an ID but no videos (empty daily prompt)
  if (id && !loading && videos.length === 0) {
    return (
      <div className="min-h-screen-safe bg-background font-quicksand content-safe-bottom">
        {/* Header */}
        <header className="sticky-header header-safe">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="p-2 text-velyar-earth hover:bg-velyar-soft"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-medium text-velyar-earth font-nunito">
              {type === 'daily-prompt' ? 'daily prompt responses' : 
               type === 'mission' ? 'mission voices' : 'videos'}
            </h1>
          </div>
        </header>

        {/* Empty state */}
        <main className="max-w-md mx-auto px-4 pb-24">
          <div className="mt-8 text-center text-muted-foreground">
            <p>No videos found for this {type === 'mission' ? 'mission' : 'prompt'} yet.</p>
            <p className="text-sm mt-2">Be the first to share!</p>
          </div>
        </main>
      </div>
    );
  }

  // If we have an ID and videos are loaded, show the video viewer
  if (id && showVideoViewer && videos.length > 0) {
    const startIndex = videos.findIndex(video => video.id === id);
    
    // If video not found, show error
    if (startIndex === -1) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center text-muted-foreground">Video not found</div>
        </div>
      );
    }
    
    return (
      <VideoViewer
        videos={videos}
        initialIndex={startIndex}
        onBack={handleBack}
      />
    );
  }

  // If no ID, the useEffect will handle navigation
  if (!id) {
    return null;
  }

  return null;
};

export default Videos;
