import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users2, Clock, Sparkles, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { PageLayout } from "@/components/PageLayout";
import { MissionCard } from "@/components/MissionCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
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

  // Header component
  const header = (
    <div className="pt-safe-header px-4">
      <div className="max-w-md mx-auto py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" className="p-2 text-velyar-earth hover:bg-velyar-soft" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-medium text-velyar-earth font-nunito">{t('missions.missions')}</h1>
      </div>
    </div>
  );

  return (
    <PageLayout header={header}>
      <div className="px-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Weekly Stats */}
          <section>
            <Card className="card-enhanced">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-velyar-earth" />
                  <span className="text-sm font-medium text-velyar-earth font-nunito">{t('missions.globalBalanceNeeded')}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-medium text-velyar-earth font-nunito">{weeklyStats.voicesShared}</div>
                    <div className="text-xs text-muted-foreground">{t('missions.voicesShared')}</div>
                  </div>
                  <div>
                    <div className="text-lg font-medium text-velyar-earth font-nunito">{weeklyStats.countries}</div>
                    <div className="text-xs text-muted-foreground">{t('missions.countries')}</div>
                  </div>
                  <div>
                    <div className="text-lg font-medium text-velyar-earth font-nunito">{weeklyStats.languages}</div>
                    <div className="text-xs text-muted-foreground">{t('missions.languages')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Active Missions */}
          <section className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Users2 className="w-5 h-5 text-velyar-earth" />
              <h2 className="text-lg font-medium text-foreground font-nunito">{t('missions.activeMissions')}</h2>
              <span className="text-sm text-muted-foreground ml-auto">
                {missions.length} {t('missions.missions')}
              </span>
            </div>
            
            {error && (
              <Card className="card-enhanced p-4 text-center">
                <p className="text-muted-foreground">{error}</p>
              </Card>
            )}

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((index) => (
                  <Card key={index} className="card-enhanced overflow-hidden">
                    <div className="flex">
                      <Skeleton className="w-24 h-20" />
                      <div className="flex-1 p-4 space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : missions.length === 0 ? (
              <Card className="card-enhanced p-8 text-center">
                <div className="space-y-3">
                  <Users2 className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                  <h3 className="text-lg font-display text-foreground">{t('missions.noMissions')}</h3>
                  <p className="text-muted-foreground font-body">
                    {t('missions.checkBackSoon')}
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {missions.map((mission) => (
                  <MissionCard 
                    key={mission.id} 
                    id={mission.id}
                    title={mission.title}
                    description={mission.description}
                    participants={mission.participants}
                    location={mission.location}
                    imageUrl={mission.imageUrl}
                    targetRegions={mission.targetRegions}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </PageLayout>
  );
};

export default Missions;