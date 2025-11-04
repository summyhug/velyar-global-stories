
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { PageLayout } from "@/components/PageLayout";

interface MissionContribution {
  mission: string;
  date: string;
  type: string;
  missionId: string;
  videoCount: number;
}

const Contributions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [contributions, setContributions] = useState<MissionContribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchContributions();
    }
  }, [user?.id]);

  const fetchContributions = async () => {
    try {
      setLoading(true);

      // Fetch user videos for stats
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select(`
          id,
          created_at,
          mission_id,
          missions(title)
        `)
        .eq('user_id', user?.id)
        .eq('is_public', true);

      if (videosError) throw videosError;

      // Process mission contributions - group by mission
      const contributionsMap = new Map<string, MissionContribution>();
      
      videosData?.forEach(video => {
        if (video.missions?.title && video.mission_id) {
          const missionTitle = video.missions.title;
          const missionId = video.mission_id;
          
          if (!contributionsMap.has(missionId)) {
            contributionsMap.set(missionId, {
              mission: missionTitle,
              date: new Date(video.created_at).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              }),
              type: 'view',
              missionId: missionId,
              videoCount: 0
            });
          }
          
          // Increment video count for this mission
          const contribution = contributionsMap.get(missionId);
          if (contribution) {
            contribution.videoCount += 1;
            // Update date to the most recent video date
            const videoDate = new Date(video.created_at);
            const currentDate = new Date(contribution.date);
            if (videoDate > currentDate) {
              contribution.date = videoDate.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              });
            }
          }
        }
      });

      // Sort by date (most recent first)
      const sortedContributions = Array.from(contributionsMap.values()).sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });

      setContributions(sortedContributions);
    } catch (err) {
      console.error('Error fetching contributions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMissionClick = (missionId: string) => {
    navigate(`/video-list/mission/${missionId}`);
  };

  // Header component
  const header = (
    <div className="px-4">
      <div className="max-w-md mx-auto py-3 flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-2 text-velyar-earth hover:bg-velyar-soft" 
          onClick={() => navigate('/profile')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-medium text-velyar-earth font-nunito">
          {t('profile.missionContributions')}
        </h1>
      </div>
    </div>
  );

  return (
    <PageLayout header={header}>
      <div className="px-4">
        <div className="max-w-md mx-auto space-y-6">
          {loading && (
            <div className="mt-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border-0 shadow-gentle">
                  <CardContent className="p-4">
                    <div className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && contributions.length === 0 && (
            <div className="mt-8 text-center">
              <Card className="border-0 shadow-gentle">
                <CardContent className="p-8">
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-lg font-medium text-foreground font-nunito mb-2">
                    No contributions yet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Start contributing to missions to see them here!
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {!loading && contributions.length > 0 && (
            <div className="mt-6 space-y-3">
              {contributions.map((contribution, index) => (
                <Card 
                  key={index} 
                  className="border-0 shadow-gentle cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleMissionClick(contribution.missionId)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-foreground font-nunito mb-1">
                          {contribution.mission}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-1">
                          {contribution.date}
                        </p>
                        {contribution.videoCount > 1 && (
                          <p className="text-xs text-muted-foreground">
                            {contribution.videoCount} contributions
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs ml-2">
                        {contribution.type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Contributions;
