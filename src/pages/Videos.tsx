
import { useState, useEffect } from "react";
import { VideoViewer } from "@/components/VideoViewer";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Videos = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showVideoViewer, setShowVideoViewer] = useState(!!id);

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState<string>("");

  useEffect(() => {
    fetchVideos();
  }, [type, id]);

  // Reset state when route parameters change to prevent caching
  useEffect(() => {
    setVideos([]);
    setLoading(true);
    setShowVideoViewer(!!id);
  }, [type, id, searchParams]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      console.log('Videos: Fetching videos for type:', type, 'id:', id);
      
      // First, fetch all public videos to ensure we have the specific video
      let query = supabase
        .from('videos')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      console.log('Videos: Executing query for type:', type, 'id:', id);
      const { data: allVideosData, error } = await query;

      if (error) {
        console.error('Videos: Query error:', error);
        throw error;
      }
      
      console.log('Videos: All videos fetched:', allVideosData?.length || 0);
      console.log('Videos: All video IDs:', allVideosData?.map(v => v.id) || []);

      // Filter videos based on type and ID
      let filteredVideos = allVideosData || [];
      
      if (type === 'mission' && id) {
        filteredVideos = filteredVideos.filter(video => video.mission_id === id);
        console.log('Videos: Filtered by mission_id:', id, 'Result:', filteredVideos.length);
      } else if (type === 'daily-prompt' && id) {
        filteredVideos = filteredVideos.filter(video => video.daily_prompt_id === id);
        console.log('Videos: Filtered by daily_prompt_id:', id, 'Result:', filteredVideos.length);
      } else if (type === 'theme' && id) {
        // For themes, we need to join with video_themes table
        console.log('Videos: Theme videos not implemented yet');
        setVideos([]);
        setLoading(false);
        return;
      } else if (type === 'archived-prompt' && id) {
        // For archived prompts, we need to find the original daily prompt
        console.log('Videos: Archived prompt videos not implemented yet');
        setVideos([]);
        setLoading(false);
        return;
      } else {
        console.log('Videos: No specific filter applied, using all videos');
      }

      console.log('Videos: Filtered videos count:', filteredVideos.length);
      console.log('Videos: Filtered video IDs:', filteredVideos.map(v => v.id));

      // Fetch the page title based on type and ID
      if (type === 'mission' && id) {
        const { data: missionData } = await supabase
          .from('missions')
          .select('title')
          .eq('id', id)
          .single();
        
        if (missionData) {
          setPageTitle(`${missionData.title} mission`);
          console.log('Videos: Set mission title:', missionData.title);
        }
      } else if (type === 'daily-prompt' && id) {
        const { data: promptData } = await supabase
          .from('daily_prompts')
          .select('prompt_text')
          .eq('id', id)
          .single();
        
        if (promptData) {
          setPageTitle(`"${promptData.prompt_text}" responses`);
          console.log('Videos: Set daily prompt title:', promptData.prompt_text);
        }
      } else {
        // Fallback titles
        switch (type) {
          case 'daily-prompt':
            setPageTitle('daily prompt responses');
            break;
          case 'mission':
            setPageTitle('mission voices');
            break;
          case 'theme':
            setPageTitle('theme voices');
            break;
          case 'archived-prompt':
            setPageTitle('archived prompt');
            break;
          default:
            setPageTitle('global voices');
        }
      }

      // Fetch profile data for each video
      const videosWithProfiles = [];
      for (const video of filteredVideos) {
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

      console.log('Videos: Final videos with profiles:', videosWithProfiles.length);
      setVideos(videosWithProfiles);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation - must be before any conditional returns
  useEffect(() => {
    if (!id && type) {
      navigate(`/video-list/${type}`);
    } else if (!id && !type) {
      navigate('/');
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
              {pageTitle || (type === 'daily-prompt' ? 'daily prompt responses' : 
               type === 'mission' ? 'mission voices' : 'videos')}
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
    // Get the specific video ID from query parameters
    const videoId = searchParams.get('video');
    let startIndex = 0;
    
    console.log('Videos: Video lookup - videoId from query:', videoId);
    console.log('Videos: Video lookup - available videos:', videos.map(v => ({ id: v.id, title: v.title })));
    
    if (videoId) {
      // Find the specific video by ID from the query parameter
      startIndex = videos.findIndex(video => video.id === videoId);
      console.log('Videos: Looking for video ID:', videoId, 'Found at index:', startIndex);
      console.log('Videos: Available video IDs:', videos.map(v => v.id));
      
      if (startIndex === -1) {
        console.log('Videos: WARNING - Video ID not found in filtered videos!');
        console.log('Videos: This might indicate a filtering issue or the video belongs to a different collection');
      }
    } else {
      // Fallback: try to find video by the route ID
      startIndex = videos.findIndex(video => video.id === id);
      console.log('Videos: Fallback - looking for video ID:', id, 'Found at index:', startIndex);
    }
    
    // If video not found, show error
    if (startIndex === -1) {
      console.log('Videos: Video not found. Available video IDs:', videos.map(v => v.id));
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>Video not found</p>
            <p className="text-sm mt-2">Looking for: {videoId || id}</p>
            <p className="text-sm">Available: {videos.length} videos</p>
          </div>
        </div>
      );
    }
    
    console.log('Videos: Showing video at index:', startIndex, 'Video ID:', videos[startIndex]?.id);
    console.log('Videos: Total videos in array:', videos.length);
    
    // Create a unique key to force re-rendering when videos change
    const videoKey = `${type}-${id}-${videoId}-${videos.length}`;
    
    return (
      <VideoViewer
        key={videoKey}
        videos={videos}
        initialIndex={startIndex}
        onBack={handleBack}
        pageTitle={pageTitle}
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
