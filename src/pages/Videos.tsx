
import { useState, useEffect } from "react";
import { VideoViewer } from "@/components/VideoViewer";
import { useParams, useNavigate } from "react-router-dom";

const Videos = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [showVideoViewer, setShowVideoViewer] = useState(!!id);

  // Mock video data
  const mockVideos = [
    {
      id: "1",
      user_id: "mock-user-1",
      video_url: "/placeholder-video.mp4",
      title: "Homemade pasta with my grandmother's secret sauce",
      profiles: {
        username: "maria_santos",
        display_name: "Maria Santos"
      },
      location: "Brazil"
    },
    {
      id: "2",
      user_id: "mock-user-2", 
      video_url: "/placeholder-video.mp4",
      title: "Traditional ramen from a local shop in Tokyo",
      profiles: {
        username: "kenji_tanaka",
        display_name: "Kenji Tanaka"
      },
      location: "Japan"
    },
    {
      id: "3",
      user_id: "mock-user-3",
      video_url: "/placeholder-video.mp4", 
      title: "Borscht with fresh bread from the market",
      profiles: {
        username: "anna_petrov",
        display_name: "Anna Petrov"
      },
      location: "Russia"
    }
  ];

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
  if (id && showVideoViewer) {
    const startIndex = mockVideos.findIndex(video => video.id === id);
    return (
      <VideoViewer
        videos={mockVideos}
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
