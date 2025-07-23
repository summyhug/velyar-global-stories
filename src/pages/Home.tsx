import { Heart, Users, MapPin, ArrowRight, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DailyPrompt } from "@/components/DailyPrompt";
import { MissionCard } from "@/components/MissionCard";
import { HighlightCard } from "@/components/HighlightCard";
import { PromptVoting } from "@/components/PromptVoting";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-light tracking-wide text-velyar-earth">velyar</h1>
          <div className="flex items-center gap-1">
            <Heart className="w-5 h-5 text-velyar-warm" />
            <span className="text-sm text-muted-foreground">global stories</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pb-20">
        {/* Daily Global Prompt */}
        <DailyPrompt />

        {/* Live Global Missions */}
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-velyar-earth" />
            <h2 className="text-lg font-medium text-foreground">live missions</h2>
          </div>
          <div className="space-y-4">
            <MissionCard
              title="street markets of the world"
              description="share the vibrant energy of your local marketplace"
              participants={1247}
              location="eastern europe needed"
              imageUrl="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=200&fit=crop"
            />
            <MissionCard
              title="morning rituals"
              description="how do you start your day?"
              participants={892}
              location="oceania needed"
              imageUrl="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=200&fit=crop"
            />
          </div>
        </section>

        {/* Global Highlights */}
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-velyar-earth" />
            <h2 className="text-lg font-medium text-foreground">global highlights</h2>
            <span className="text-sm text-muted-foreground">editor's picks</span>
          </div>
          <div className="space-y-4">
            <HighlightCard
              title="grandmother's lullaby"
              location="kathmandu, nepal"
              author="maya_k"
              views="12.4k"
              imageUrl="https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&h=300&fit=crop"
            />
            <HighlightCard
              title="first snow of winter"
              location="reykjavik, iceland"
              author="bjork_a"
              views="8.7k"
              imageUrl="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
            />
          </div>
        </section>

        {/* Tomorrow's Prompt Voting */}
        <section className="mt-8">
          <PromptVoting />
        </section>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-6">
        <Link to="/create">
          <Button
            size="lg"
            className="rounded-full w-14 h-14 bg-gradient-warm shadow-warm hover:shadow-lg transition-all duration-300"
          >
            <Video className="w-6 h-6" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Home;