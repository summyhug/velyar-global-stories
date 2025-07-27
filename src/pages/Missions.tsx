
import { ArrowLeft, MapPin, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MissionCard } from "@/components/MissionCard";
import { useNavigate } from "react-router-dom";

const Missions = () => {
  const navigate = useNavigate();
  
  const activeMissions = [
    {
      title: "street markets of the world",
      description: "share the vibrant energy of your local marketplace",
      participants: 1247,
      location: "eastern europe needed",
      imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=200&fit=crop"
    },
    {
      title: "morning rituals",
      description: "how do you start your day?",
      participants: 892,
      location: "oceania needed",
      imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=200&fit=crop"
    },
    {
      title: "sounds of home",
      description: "capture the audio landscape of your daily life",
      participants: 654,
      location: "africa needed",
      imageUrl: "https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=400&h=200&fit=crop"
    },
    {
      title: "local transportation",
      description: "how do people move around in your city?",
      participants: 423,
      location: "south america needed",
      imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=200&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen bg-background font-quicksand">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-medium text-foreground font-nunito">mission hub</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pb-24">
        {/* Geographic Needs Banner */}
        <Card className="mt-6 bg-velyar-glow/20 border-velyar-earth/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-velyar-earth" />
              <span className="text-sm font-medium text-velyar-earth font-nunito">global balance needed</span>
            </div>
            <p className="text-xs text-muted-foreground">
              we're looking for more stories from eastern europe, oceania, and central africa this week
            </p>
          </CardContent>
        </Card>

        {/* Active Missions */}
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-velyar-earth" />
            <h2 className="text-lg font-medium text-foreground font-nunito">active missions</h2>
            <span className="text-sm text-muted-foreground ml-auto">4 live</span>
          </div>
          
          <div className="space-y-4">
            {activeMissions.map((mission, index) => (
              <MissionCard key={index} {...mission} />
            ))}
          </div>
        </section>

        {/* Mission Stats */}
        <section className="mt-8">
          <Card className="bg-card border-0 shadow-gentle">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-foreground mb-4 font-nunito">this week's impact</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-medium text-velyar-earth font-nunito">3,216</div>
                  <div className="text-xs text-muted-foreground">stories shared</div>
                </div>
                <div>
                  <div className="text-lg font-medium text-velyar-earth font-nunito">147</div>
                  <div className="text-xs text-muted-foreground">countries</div>
                </div>
                <div>
                  <div className="text-lg font-medium text-velyar-earth font-nunito">12</div>
                  <div className="text-xs text-muted-foreground">languages</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Missions;
