
import { useState, useEffect } from "react";
import { Users, MapPin } from "lucide-react";
import { DailyPrompt } from "@/components/DailyPrompt";
import { MissionCard } from "@/components/MissionCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Mission {
  id: string;
  title: string;
  description: string;
  participants_count: number;
  location_needed: string;
  image_url: string;
}

const Home = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const { data: missionsData, error } = await supabase
          .from('missions')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(4);

        if (error) throw error;

        // Use stored participant counts from database
        const missionsWithCounts = (missionsData || []).map(mission => ({
          ...mission,
          participants_count: mission.participants_count || 0
        }));

        setMissions(missionsWithCounts);
      } catch (error) {
        console.error('Error fetching missions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();
  }, []);
  return (
    <div className="min-h-screen-safe bg-background font-quicksand flex flex-col">
      {/* Header */}
      <header className="sticky-header header-safe px-4">
        <div className="max-w-md mx-auto py-3 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-wide text-velyar-earth font-nunito">velyar</h1>
          <div className="flex items-center gap-1">
            <img 
              src="/lovable-uploads/6e35e706-01c0-46b9-b5c6-8c50b1848687.png" 
              alt="Octopus" 
              className="w-5 h-5 object-contain"
            />
            <span className="text-sm text-muted-foreground">global voices</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto content-safe-bottom px-4">
        <div className="max-w-md mx-auto">
        {/* Daily Global Prompt */}
        <DailyPrompt />

        {/* Live Global Missions */}
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-velyar-earth" />
            <h2 className="text-lg font-medium text-foreground font-nunito">live missions</h2>
          </div>
          <div className="space-y-4">
            {loading ? (
              // Loading skeletons
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="flex">
                    <Skeleton className="w-24 h-20" />
                    <div className="flex-1 p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </Card>
              ))
            ) : missions.length > 0 ? (
              // Dynamic mission cards
              missions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  id={mission.id}
                  title={mission.title}
                  description={mission.description}
                  participants={mission.participants_count}
                  location={mission.location_needed || ''}
                  imageUrl={mission.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=200&fit=crop'}
                />
              ))
            ) : (
              // No missions fallback
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">No active missions at the moment</p>
              </Card>
            )}
          </div>
        </section>
        </div>
      </main>
    </div>
  );
};

export default Home;
