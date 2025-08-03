import { ArrowLeft, MapPin, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MissionCard } from "@/components/MissionCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGeographicAnalysis } from "@/hooks/useGeographicAnalysis";

interface Mission {
  id: string;
  title: string;
  description: string;
  participants: number;
  location: string;
  imageUrl: string;
  targetRegions?: string[] | null;
}

interface WeeklyStats {
  voicesShared: number;
  countries: number;
  languages: number;
}

interface GlobalPrompt {
  id: string;
  message_text: string;
  priority: number;
  target_regions?: string[];
}

const Missions = () => {
  const navigate = useNavigate();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({ voicesShared: 0, countries: 0, languages: 0 });
  const [globalPrompt, setGlobalPrompt] = useState<GlobalPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { analysis: geoAnalysis } = useGeographicAnalysis();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch missions
        const { data: missionsData, error: missionsError } = await supabase
          .from('missions')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (missionsError) throw missionsError;

        const formattedMissions: Mission[] = missionsData.map(mission => ({
          id: mission.id,
          title: mission.title,
          description: mission.description,
          participants: mission.participants_count,
          location: mission.location_needed || '',
          imageUrl: mission.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=200&fit=crop',
          targetRegions: Array.isArray(mission.target_regions) ? mission.target_regions as string[] : null
        }));

        setMissions(formattedMissions);

        // Fetch weekly statistics (videos from the last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const { data: weeklyVideos, error: statsError } = await supabase
          .from('videos')
          .select('id, location, language, user_id')
          .eq('is_public', true)
          .gte('created_at', weekAgo.toISOString());

        if (statsError) throw statsError;

        // Calculate statistics
        const voicesShared = weeklyVideos?.length || 0;
        
        const countries = weeklyVideos
          ?.map(video => video.location)
          .filter(location => location && location.trim() !== '')
          .map(location => location.split(',').pop()?.trim().toLowerCase())
          .filter(Boolean) || [];

        const uniqueCountries = new Set(countries).size;

        const uniqueLanguages = new Set(
          weeklyVideos
            ?.map(video => video.language)
            .filter(Boolean)
        ).size;

        setWeeklyStats({
          voicesShared,
          countries: uniqueCountries,
          languages: uniqueLanguages
        });

        // Use cached geographic analysis for smart prompts
        const { data: manualPrompts, error: promptsError } = await supabase
          .from('global_prompts')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: false })
          .limit(1);

        if (promptsError) throw promptsError;

        // If we have a manual prompt, use it
        if (manualPrompts && manualPrompts.length > 0) {
          const prompt = manualPrompts[0];
          setGlobalPrompt({
            id: prompt.id,
            message_text: prompt.message_text,
            priority: prompt.priority,
            target_regions: Array.isArray(prompt.target_regions) 
              ? (prompt.target_regions as string[]) 
              : undefined
          });
        } else if (geoAnalysis && geoAnalysis.recommended_targets.length > 0) {
          // Use cached geographic analysis for smart prompts
          setGlobalPrompt({
            id: 'auto-generated',
            message_text: geoAnalysis.recommended_targets[0],
            priority: 0,
            target_regions: geoAnalysis.underrepresented_regions
          });
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [geoAnalysis]);

  return (
    <div className="min-h-screen-safe bg-background font-quicksand content-safe-bottom">
      {/* Header */}
      <header className="sticky-header header-safe">
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
        {/* Dynamic Global Prompt Banner */}
        {globalPrompt && (
          <Card className="mt-6 bg-velyar-glow/20 border-velyar-earth/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-velyar-earth" />
                <span className="text-sm font-medium text-velyar-earth font-nunito">global balance needed</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {globalPrompt.message_text.toLowerCase()}
              </p>
            </CardContent>
          </Card>
        )}

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
                <MissionCard
                  key={mission.id}
                  id={mission.id}
                  title={mission.title}
                  description={mission.description}
                  participants={mission.participants}
                  location={mission.location}
                  imageUrl={mission.imageUrl}
                  targetRegions={mission.targetRegions || undefined}
                />
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
                  <div className="text-lg font-medium text-velyar-earth font-nunito">
                    {loading ? '...' : weeklyStats.voicesShared.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">voices shared</div>
                </div>
                <div>
                  <div className="text-lg font-medium text-velyar-earth font-nunito">
                    {loading ? '...' : weeklyStats.countries}
                  </div>
                  <div className="text-xs text-muted-foreground">countries</div>
                </div>
                <div>
                  <div className="text-lg font-medium text-velyar-earth font-nunito">
                    {loading ? '...' : weeklyStats.languages}
                  </div>
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