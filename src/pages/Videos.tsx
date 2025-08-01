
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
      author: "maria_santos",
      country: "brazil",
      videoUrl: "/placeholder-video.mp4",
      caption: "Homemade pasta with my grandmother's secret sauce"
    },
    {
      id: "2",
      author: "kenji_tanaka",
      country: "japan",
      videoUrl: "/placeholder-video.mp4",
      caption: "Traditional ramen from a local shop in Tokyo"
    },
    {
      id: "3",
      author: "anna_petrov",
      country: "russia",
      videoUrl: "/placeholder-video.mp4",
      caption: "Borscht with fresh bread from the market"
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
