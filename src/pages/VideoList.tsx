
import { useState } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useParams, useNavigate } from "react-router-dom";

const VideoList = () => {
  const { type } = useParams();
  const navigate = useNavigate();

  // Mock video data
  const mockVideos = [
    {
      id: "1",
      author: "maria_santos",
      country: "brazil",
      videoUrl: "/placeholder-video.mp4",
      caption: "Homemade pasta with my grandmother's secret sauce",
      thumbnail: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=300&h=400&fit=crop"
    },
    {
      id: "2",
      author: "kenji_tanaka",
      country: "japan",
      videoUrl: "/placeholder-video.mp4",
      caption: "Traditional ramen from a local shop in Tokyo",
      thumbnail: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=400&fit=crop"
    },
    {
      id: "3",
      author: "anna_petrov",
      country: "russia",
      videoUrl: "/placeholder-video.mp4",
      caption: "Borscht with fresh bread from the market",
      thumbnail: "https://images.unsplash.com/photo-1547592180-85f173990554?w=300&h=400&fit=crop"
    },
    {
      id: "4",
      author: "carlos_mendez",
      country: "mexico",
      videoUrl: "/placeholder-video.mp4",
      caption: "Street tacos from my neighborhood",
      thumbnail: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=400&fit=crop"
    }
  ];

  const handleVideoClick = (videoId: string) => {
    navigate(`/videos/${type}/${videoId}`);
  };

  const getTitle = () => {
    if (!type) return "videos";
    
    if (type.startsWith('theme-')) {
      const theme = type.replace('theme-', '').replace('-', ' ');
      return `${theme} voices`;
    }
    
    if (type.startsWith('prompt-')) {
      const prompt = type.replace('prompt-', '').replace(/-/g, ' ');
      return `"${prompt}"`;
    }
    
    if (type.startsWith('mission-')) {
      const mission = type.replace('mission-', '').replace(/-/g, ' ');
      return `${mission} mission`;
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
        <div className="mt-6 grid grid-cols-2 gap-3">
          {mockVideos.map((video) => (
            <Card 
              key={video.id} 
              className="cursor-pointer hover:shadow-gentle transition-shadow border-velyar-earth/10"
              onClick={() => handleVideoClick(video.id)}
            >
              <CardContent className="p-0">
                <div className="relative aspect-[3/4] rounded-t-lg overflow-hidden">
                  <img 
                    src={video.thumbnail} 
                    alt={video.caption}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="p-3">
                  <div className="font-medium text-velyar-earth font-nunito text-sm mb-1">
                    {video.author}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {video.country}
                  </div>
                  <p className="text-xs text-foreground line-clamp-2">
                    {video.caption}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            className="border-velyar-earth/20 text-velyar-earth hover:bg-velyar-soft"
          >
            load more voices
          </Button>
        </div>
      </main>
    </div>
  );
};

export default VideoList;
