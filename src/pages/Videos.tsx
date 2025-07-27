
import { useState } from "react";
import { VideoViewer } from "@/components/VideoViewer";
import { useParams, useNavigate } from "react-router-dom";

const Videos = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [showVideoViewer, setShowVideoViewer] = useState(true);

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

  const handleBack = () => {
    setShowVideoViewer(false);
    navigate(-1);
  };

  if (showVideoViewer) {
    return (
      <VideoViewer
        videos={mockVideos}
        onBack={handleBack}
      />
    );
  }

  return null;
};

export default Videos;
