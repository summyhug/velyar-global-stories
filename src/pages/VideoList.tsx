
import { useState, useEffect } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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
  } | null;
}

const VideoList = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
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

      let query = supabase
        .from('videos')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      // Filter based on type and id
      if (type === 'mission' && id) {
        query = query.eq('mission_id', id);
        
        // Fetch mission title
        const { data: missionData } = await supabase
          .from('missions')
          .select('title')
          .eq('id', id)
          .single();
        
        if (missionData) {
          setMissionTitle(missionData.title);
        }
      } else if (type === 'daily-prompt' && id) {
        query = query.eq('daily_prompt_id', id);
      }

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
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (videoId: string) => {
    navigate(`/videos/${type}/${videoId}`);
  };

  const getTitle = () => {
    if (type === 'mission' && missionTitle) {
      return `${missionTitle} mission`;
    }
    
    switch (type) {
      case 'daily-prompt':
        return 'daily prompt responses';
      case 'mission':
        return 'mission voices';
      default:
        return 'global voices';
    }
  };

  return (
    <div className="min-h-screen bg-background font-quicksand">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="p-2 text-velyar-earth hover:bg-velyar-soft"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-medium text-velyar-earth font-nunito">{getTitle()}</h1>
        </div>
      </header>

      {/* Video Grid */}
      <main className="max-w-md mx-auto px-4 pb-24">
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
                    <img 
                      src={video.thumbnail_url || "https://images.unsplash.com/photo-1626544590736-4a351aaa2fe7?w=300&h=400&fit=crop"} 
                      alt={video.title || video.description || "Video"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="font-medium text-velyar-earth font-nunito text-sm mb-1">
                      {video.profiles?.display_name || video.profiles?.username || 'Anonymous'}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {video.location || 'Unknown location'}
                    </div>
                    <p className="text-xs text-foreground line-clamp-2">
                      {video.description || video.title || 'No description'}
                    </p>
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
      </main>
    </div>
  );
};

export default VideoList;
