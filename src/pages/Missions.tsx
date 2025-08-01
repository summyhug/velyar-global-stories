import { ArrowLeft, MapPin, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MissionCard } from "@/components/MissionCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Mission {
  id: string;
  title: string;
  description: string;
  participants: number;
  location: string;
  imageUrl: string;
}

const Missions = () => {
  const navigate = useNavigate();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const { data, error } = await supabase
          .from('missions')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedMissions: Mission[] = data.map(mission => ({
          id: mission.id,
          title: mission.title,
          description: mission.description,
          participants: mission.participants_count,
          location: mission.location_needed || '',
          imageUrl: mission.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=200&fit=crop'
        }));

        setMissions(formattedMissions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch missions');
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();
  }, []);

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
            <span className="text-sm text-muted-foreground ml-auto">
              {loading ? '...' : `${missions.length} live`}
            </span>
          </div>
          
          {error && (
            <Card className="bg-destructive/10 border-destructive/20 mb-4">
              <CardContent className="p-4">
                <p className="text-sm text-destructive">Failed to load missions: {error}</p>
              </CardContent>
            </Card>
          )}
          
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
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
            ) : (
              missions.map((mission) => (
                <MissionCard key={mission.id} {...mission} />
              ))
            )}
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