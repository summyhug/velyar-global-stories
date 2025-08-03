
import { useState, useEffect } from "react";
import { VideoViewer } from "@/components/VideoViewer";
import { useParams, useNavigate } from "react-router-dom";
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
        query = query.eq('daily_prompt_id', id);
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
    if (id && type === 'daily-prompt') {
      // For daily prompts, go back to home page
      navigate('/');
    } else if (id) {
      // For other types, go back to the video list
      navigate(`/video-list/${type}`);
    } else {
      // If no ID, go back to previous page
      navigate(-1);
    }
  };

  // If we have an ID, show the video viewer
  if (id && showVideoViewer && !loading) {
    const startIndex = videos.findIndex(video => video.id === id);
    return (
      <VideoViewer
        videos={videos}
        initialIndex={startIndex >= 0 ? startIndex : 0}
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
