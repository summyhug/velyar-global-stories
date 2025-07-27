
import { Users, MapPin } from "lucide-react";
import { DailyPrompt } from "@/components/DailyPrompt";
import { MissionCard } from "@/components/MissionCard";

const Home = () => {
  return (
    <div className="min-h-screen bg-background font-quicksand">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-wide text-velyar-earth font-nunito">velyar</h1>
          <div className="flex items-center gap-1">
            <span className="text-lg">🐙</span>
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
            <h2 className="text-lg font-medium text-foreground font-nunito">live missions</h2>
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
      </main>
    </div>
  );
};

export default Home;
