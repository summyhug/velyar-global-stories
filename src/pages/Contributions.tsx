import { ArrowLeft, Globe, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { OctopusButton } from "@/components/OctopusButton";

const Contributions = () => {
  const navigate = useNavigate();

  // Mock user contributions data
  const userContributions = [
    {
      id: "1",
      prompt: "What did you eat last night?",
      videoUrl: "/placeholder-video.mp4",
      thumbnail: "/placeholder.svg",
      date: "2024-01-15",
      octosReceived: 23,
      commentsReceived: 5,
      countriesReached: ["Brazil", "Japan", "Germany", "USA"],
      comments: [
        { author: "maria_santos", country: "Brazil", text: "This looks so delicious! 🍝", octos: 3 },
        { author: "kenji_tanaka", country: "Japan", text: "Amazing recipe!", octos: 2 },
        { author: "anna_petrov", country: "Russia", text: "I want to try making this", octos: 1 }
      ]
    },
    {
      id: "2", 
      prompt: "Street Art Mission - Berlin",
      videoUrl: "/placeholder-video.mp4",
      thumbnail: "/placeholder.svg",
      date: "2024-01-10",
      octosReceived: 15,
      commentsReceived: 3,
      countriesReached: ["Germany", "France", "Spain"],
      comments: [
        { author: "pierre_dubois", country: "France", text: "Beautiful street art!", octos: 2 },
        { author: "carlos_martinez", country: "Spain", text: "Love the colors", octos: 1 }
      ]
    }
  ];

  return (
    <div className="min-h-screen-safe bg-velyar-beige content-safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-velyar-beige border-b border-velyar-teal/10">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-velyar-teal hover:bg-velyar-teal/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-velyar-teal font-nunito">my contributions</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-24">
        <div className="space-y-6">
          {userContributions.map((contribution) => (
            <Card key={contribution.id} className="bg-white/60 border-velyar-teal/20 shadow-gentle">
              <CardContent className="p-6">
                {/* Video Thumbnail */}
                <div className="aspect-video bg-gray-200 rounded-lg mb-4 relative overflow-hidden">
                  <img 
                    src={contribution.thumbnail} 
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="bg-white/20 hover:bg-white/30 text-white"
                    >
                      ▶
                    </Button>
                  </div>
                </div>

                {/* Prompt Title */}
                <h3 className="font-semibold text-velyar-teal mb-2 font-nunito">
                  {contribution.prompt}
                </h3>
                
                {/* Date */}
                <p className="text-sm text-velyar-teal/70 mb-4">
                  shared on {new Date(contribution.date).toLocaleDateString()}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <OctopusButton isLiked={false} />
                      <span className="ml-1 text-lg font-semibold text-velyar-teal">
                        {contribution.octosReceived}
                      </span>
                    </div>
                    <p className="text-xs text-velyar-teal/70">octos received</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <MessageCircle className="w-5 h-5 text-velyar-brown mr-1" />
                      <span className="text-lg font-semibold text-velyar-teal">
                        {contribution.commentsReceived}
                      </span>
                    </div>
                    <p className="text-xs text-velyar-teal/70">comments</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Globe className="w-5 h-5 text-velyar-coral mr-1" />
                      <span className="text-lg font-semibold text-velyar-teal">
                        {contribution.countriesReached.length}
                      </span>
                    </div>
                    <p className="text-xs text-velyar-teal/70">countries reached</p>
                  </div>
                </div>

                {/* Countries Reached */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-velyar-teal mb-2">reached countries:</p>
                  <div className="flex flex-wrap gap-2">
                    {contribution.countriesReached.map((country) => (
                      <span 
                        key={country}
                        className="px-2 py-1 bg-velyar-brown/10 text-velyar-brown text-xs rounded-full"
                      >
                        {country}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recent Comments */}
                <div>
                  <p className="text-sm font-medium text-velyar-teal mb-2">recent comments:</p>
                  <div className="space-y-2">
                    {contribution.comments.slice(0, 3).map((comment, index) => (
                      <div key={index} className="bg-velyar-beige/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-velyar-teal">
                              {comment.author}
                            </span>
                            <span className="text-xs text-velyar-teal/50">
                              from {comment.country}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <OctopusButton isLiked={false} />
                            <span className="text-xs text-velyar-teal">
                              {comment.octos}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-velyar-teal/80">
                          {comment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Contributions;