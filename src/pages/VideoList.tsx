
import { useState, useEffect } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLayout } from "@/components/PageLayout";
import { useTranslation } from "react-i18next";
import { getCountryFlag } from "@/utils/countryFlags";

interface Video {
  id: string;
  title?: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  location?: string;
  user_id: string;
  created_at: string;
  profiles?: {
    username?: string;
    display_name?: string;
    country?: string;
  } | null;
}

const VideoList = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missionTitle, setMissionTitle] = useState<string>("");

  useEffect(() => {
    fetchVideos();
  }, [type, id]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Handle theme-based video fetching
      if (type === 'theme' && id) {
        // For themes, we need to join with video_themes table
        const { data: themeVideos, error: themeError } = await supabase
          .from('video_themes')
          .select(`
            videos!inner (
              *
            )
          `)
          .eq('theme_id', id);

        if (themeError) throw themeError;

        // Extract videos and fetch profile data separately
        const videoList = themeVideos?.map(item => item.videos).filter(Boolean) || [];
        
        const videosWithProfiles = [];
        for (const video of videoList) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, display_name, country')
            .eq('user_id', video.user_id)
            .single();
          
          videosWithProfiles.push({
            ...video,
            profiles: profileData
          });
        }
        
        setVideos(videosWithProfiles);

        // Fetch theme title
        const { data: themeData } = await supabase
          .from('themes')
          .select('name')
          .eq('id', id)
          .single();
        
        if (themeData) {
          setMissionTitle(themeData.name);
        }
        return;
      }

      // Handle archived prompt video fetching
      if (type === 'archived-prompt' && id) {
        // Get archived prompt details
        const { data: promptData } = await supabase
          .from('archived_prompts')
          .select('prompt_text')
          .eq('id', id)
          .single();
        
        if (promptData) {
          setMissionTitle(`"${promptData.prompt_text}"`);
          
          // Find original daily prompt to get videos
          const { data: originalPrompt } = await supabase
            .from('daily_prompts')
            .select('id')
            .eq('prompt_text', promptData.prompt_text)
            .limit(1)
            .single();
          
          if (originalPrompt) {
            // Get videos for this prompt
            const { data: videosData } = await supabase
              .from('videos')
              .select('*')
              .eq('daily_prompt_id', originalPrompt.id)
              .eq('is_public', true)
              .order('created_at', { ascending: false });
            
            // Fetch profile data for each video
            const videosWithProfiles = [];
            if (videosData) {
              for (const video of videosData) {
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('username, display_name, country')
                  .eq('user_id', video.user_id)
                  .single();
                
                videosWithProfiles.push({
                  ...video,
                  profiles: profileData
                });
              }
            }
            setVideos(videosWithProfiles);
          }
        }
        return;
      }

      // Handle regular video fetching for missions and daily prompts
      let query = supabase
        .from('videos')
        .select('*')
        .eq('is_public', true)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      // Filter based on type and id
      if (type === 'mission' && id) {
        console.log('VideoList: Filtering for mission ID:', id);
        query = query.eq('mission_id', id);
        
        // Fetch mission title
        const { data: missionData } = await supabase
          .from('missions')
          .select('title')
          .eq('id', id)
          .single();
        
        if (missionData) {
          setMissionTitle(missionData.title);
          console.log('VideoList: Set mission title:', missionData.title);
        } else {
          console.log('VideoList: No mission data found for ID:', id);
        }
      } else if (type === 'daily-prompt' && id) {
        console.log('VideoList: Filtering for daily prompt ID:', id);
        query = query.eq('daily_prompt_id', id);
      }

      console.log('VideoList: Executing query for type:', type, 'id:', id);
      const { data: videosData, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // Fetch profile data separately
      const videosWithProfiles = [];
      if (videosData) {
        for (const video of videosData) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, display_name, country')
            .eq('user_id', video.user_id)
            .single();
          
          videosWithProfiles.push({
            ...video,
            profiles: profileData
          });
        }
      }

      console.log('VideoList: Found videos:', videosWithProfiles.length);
      console.log('VideoList: Video IDs:', videosWithProfiles.map(v => v.id));
      console.log('VideoList: Video details:', videosWithProfiles.map(v => ({
        id: v.id,
        is_public: v.is_public,
        is_hidden: v.is_hidden,
        moderation_status: v.moderation_status,
        mission_id: v.mission_id,
        daily_prompt_id: v.daily_prompt_id
      })));
      setVideos(videosWithProfiles);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (videoId: string) => {
    // Navigate to the video viewer page with the specific video
    const targetUrl = `/videos/${type}/${id}?video=${videoId}`;
    console.log('VideoList: Navigating to:', targetUrl, 'for video ID:', videoId);
    console.log('VideoList: Current type:', type, 'id:', id);
    navigate(targetUrl);
  };

  const handleBack = () => {
    if (type === 'daily-prompt') {
      navigate('/');
    } else if (type === 'theme' || type === 'archived-prompt') {
      navigate('/explore');
    } else {
      navigate(-1);
    }
  };

  const getTitle = () => {
    console.log('VideoList: getTitle called - missionTitle:', missionTitle, 'type:', type);
    
    if (missionTitle) {
      if (type === 'mission') {
        const title = `${missionTitle} mission`;
        console.log('VideoList: Returning mission title:', title);
        return title;
      } else if (type === 'theme') {
        return `${missionTitle} voices`;
      } else if (type === 'archived-prompt') {
        return missionTitle;
      }
    }
    
    const fallbackTitle = (() => {
      switch (type) {
        case 'daily-prompt':
          return 'daily prompt responses';
        case 'mission':
          return 'mission voices';
        case 'theme':
          return 'theme voices';
        case 'archived-prompt':
          return 'archived prompt';
        default:
          return 'global voices';
      }
    })();
    
    console.log('VideoList: Returning fallback title:', fallbackTitle);
    return fallbackTitle;
  };

  // Header component
  const header = (
    <div className="pt-safe-header px-4">
      <div className="max-w-md mx-auto py-3 flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBack}
          className="p-2 text-velyar-earth hover:bg-velyar-soft"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-medium text-velyar-earth font-nunito">{getTitle()}</h1>
      </div>
    </div>
  );

  return (
    <PageLayout header={header}>
      <div className="px-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Video Grid */}
          {loading && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border-velyar-earth/10">
                  <CardContent className="p-0">
                    <Skeleton className="aspect-[3/4] rounded-t-lg" />
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-8 text-center text-muted-foreground">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && videos.length === 0 && (
            <div className="mt-8 text-center text-muted-foreground">
              <p>No videos found for this {type === 'mission' ? 'mission' : 'category'} yet.</p>
            </div>
          )}

          {!loading && !error && videos.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              {videos.map((video) => (
                <Card 
                  key={video.id} 
                  className="cursor-pointer hover:shadow-gentle transition-shadow border-velyar-earth/10"
                    onClick={() => handleVideoClick(video.id)}
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-[3/4] rounded-t-lg overflow-hidden">
                      {video.thumbnail_url ? (
                        <img 
                          src={video.thumbnail_url} 
                          alt={video.title || "Video thumbnail"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-velyar-earth/20 to-velyar-warm/20 flex items-center justify-center">
                          <div className="text-velyar-earth/60 text-xs text-center px-2">
                            Video Preview
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {getCountryFlag(video.profiles?.country)}
                        </span>
                        <div className="font-medium text-velyar-earth font-nunito text-sm">
                          {video.profiles?.display_name || video.profiles?.username || 'Anonymous'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && !error && videos.length > 0 && (
            <div className="mt-8 text-center">
              <Button 
                variant="outline" 
                className="border-velyar-earth/20 text-velyar-earth hover:bg-velyar-soft"
                onClick={fetchVideos}
              >
                load more voices
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default VideoList;
