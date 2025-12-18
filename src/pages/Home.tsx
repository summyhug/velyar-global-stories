import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users2, Clock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { PageLayout } from "@/components/PageLayout";
import { DailyPrompt } from "@/components/DailyPrompt";
import { MissionCard } from "@/components/MissionCard";
import { Skeleton } from "@/components/ui/skeleton";
import StoryCamera from "../../StoryCamera";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

interface Mission {
  id: string;
  title: string;
  description: string;
  participants_count: number;
  location_needed: string;
  image_url: string;
}

const Home = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingVideo, setCheckingVideo] = useState(true); // Prevent flash on Android

  useEffect(() => {
    // Android-specific: Check for video data on mount/resume and navigate to preview
    // (iOS doesn't need this because camera is modal and navigation happens immediately)
    const checkVideoAndNavigate = async () => {
      try {
        const platform = Capacitor.getPlatform();
        if (platform !== 'android') {
          setCheckingVideo(false);
          return; // Only run on Android
        }

        const data = await (StoryCamera as any).getVideoData?.();
        if (data?.hasVideo && data.filePath) {
          console.log('🏠 Home: Found recorded video on Android, navigating to preview');
          console.log('🏠 Home: Video context:', { contextType: data.contextType, missionId: data.missionId, promptId: data.promptId });
          try { sessionStorage.setItem('lastStoryVideoPath', data.filePath); } catch {}

          // Build URL with context parameters
          let url = '/video-preview?filePath=' + encodeURIComponent(data.filePath);
          if (data.contextType) url += '&contextType=' + encodeURIComponent(data.contextType);
          if (data.missionId) url += '&missionId=' + encodeURIComponent(data.missionId);
          if (data.promptId) url += '&promptId=' + encodeURIComponent(data.promptId);

          navigate(url, {
            replace: true,
            state: {
              filePath: data.filePath,
              contextType: data.contextType,
              missionId: data.missionId,
              promptId: data.promptId
            }
          });
        } else {
          setCheckingVideo(false);
        }
      } catch (err) {
        console.warn('Home: Error checking video data:', err);
        setCheckingVideo(false);
      }
    };

    // Check on mount
    checkVideoAndNavigate();

    // Also check on app resume (when Home becomes visible after Activity finishes)
    const onVisibility = async () => {
      if (document.visibilityState === 'visible') {
        setCheckingVideo(true);
        await checkVideoAndNavigate();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

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

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      console.log('🏠 Home: useEffect cleanup');
    };
  }, [navigate]);

  const handleStartRecording = async () => {
    try {
      console.log('🎬 ===== HOME: STARTING STORYCAMERA =====');
      
      // Fetch current daily prompt
      let promptText = "Daily Prompt";
      let promptId = undefined;
      
      try {
        const today = new Date().toISOString().split('T')[0];
        console.log('Home: Looking for prompt for date:', today);
        
        let { data: todayPrompt, error: todayError } = await supabase
          .from('daily_prompts')
          .select('id, prompt_text')
          .eq('date', today)
          .eq('is_active', true)
          .maybeSingle();
          
        if (todayError) {
          console.error('Home: Error fetching today\'s prompt:', todayError);
        }

        // If no prompt for today, get the most recent active prompt
        if (!todayPrompt) {
          console.log('Home: No prompt for today, fetching most recent active prompt');
          const { data: recentPrompt, error: recentError } = await supabase
            .from('daily_prompts')
            .select('id, prompt_text')
            .eq('is_active', true)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          if (recentError) {
            console.error('Home: Error fetching recent prompt:', recentError);
          }
          
          if (recentPrompt) {
            promptText = recentPrompt.prompt_text;
            promptId = recentPrompt.id;
            console.log('Home: Using recent prompt:', promptText);
          }
        } else {
          promptText = todayPrompt.prompt_text;
          promptId = todayPrompt.id;
          console.log('Home: Using today\'s prompt:', promptText);
        }
      } catch (error) {
        console.error('Home: Error fetching prompt:', error);
        // Continue with default prompt
      }
      
      const storyResult = await StoryCamera.recordVideo({
        duration: 30,
        camera: 'rear',
        allowOverlays: true,
        promptName: promptText,
        contextType: 'daily',
        promptId: promptId
      });

      console.log('✅ ===== HOME: STORYCAMERA SUCCESS =====');
      console.log('Home StoryCamera result:', storyResult);

      // On iOS, navigate immediately since camera is modal
      // On Android, let the visibilitychange handler take care of navigation
      const platform = Capacitor.getPlatform();
      if (platform === 'ios') {
        // Navigate to video preview with robust filePath extraction
        let fp: string | undefined = (storyResult as any)?.filePath;
        if (!fp) {
          // Fallback: ask native for stored path
          try {
            const data = await (StoryCamera as any).getVideoData?.();
            if (data?.filePath) fp = data.filePath;
          } catch {}
        }

        if (!fp) {
          // Retry a couple times with tiny delay in case webview resumes a tick later
          for (let i = 0; i < 3 && !fp; i++) {
            await new Promise(r => setTimeout(r, 300));
            try {
              const data = await (StoryCamera as any).getVideoData?.();
              if (data?.filePath) fp = data.filePath;
            } catch {}
          }
        }

        if (fp) {
          try { sessionStorage.setItem('lastStoryVideoPath', fp); } catch {}
          const target = '/video-preview?filePath=' + encodeURIComponent(fp) + (promptId ? ('&promptId=' + encodeURIComponent(promptId)) : '') + '&contextType=daily';
          console.log('🚀 Home (iOS): Navigating to:', target);
          navigate(target, {
            state: {
              filePath: fp,
              promptId: storyResult.promptId || promptId,
              contextType: storyResult.contextType || 'daily'
            }
          });
        } else {
          console.error('❌ Home (iOS): Could not determine filePath after recording');
        }
      } else {
        console.log('🤖 Home (Android): Recording complete, visibilitychange handler will handle navigation');
      }
      
    } catch (error) {
      console.error('❌ ===== HOME: STORYCAMERA FAILED =====');
      console.error('Home StoryCamera error:', error.message);
    }
  };

  // Header component
  const header = (
    <div className="px-4">
      <div className="max-w-md mx-auto py-3 flex items-center justify-between">
        <h1 className="text-2xl font-display text-velyar-earth tracking-wide">{t("home.velyar")}</h1>
        <div className="flex items-center gap-1">
          <img 
            src="/lovable-uploads/6e35e706-01c0-46b9-b5c6-8c50b1848687.png" 
            alt="Octopus" 
            className="w-5 h-5 object-contain"
          />
          <span className="text-sm text-muted-foreground leading-none font-ui self-center">{t("home.globalVoices")}</span>
        </div>
      </div>
    </div>
  );

  // Show nothing while checking for video on Android (prevents flash)
  if (checkingVideo) {
    return null;
  }

  return (
    <PageLayout header={header}>
      {/* Enhanced Main Content */}
      <div className="px-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Daily Global Prompt Section */}
          <section className="mt-4">
            <DailyPrompt />
          </section>

          {/* Live Missions Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Users2 className="w-5 h-5 text-velyar-earth" />
                <h2 className="text-lg font-display text-foreground">{t("home.liveMissions")}</h2>
                <Sparkles className="w-4 h-4 text-velyar-warm animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                // Enhanced loading skeletons with better visual hierarchy
                Array.from({ length: 4 }).map((_, index) => (
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
                ))
              ) : missions.length > 0 ? (
                // Enhanced mission cards with better spacing
                <div className="space-y-4">
                  {missions.map((mission, index) => (
                    <div key={mission.id} className="animate-in fade-in-0 slide-in-from-bottom-2" style={{ animationDelay: `${index * 100}ms` }}>
                      <MissionCard
                        id={mission.id}
                        title={mission.title}
                        description={mission.description}
                        participants={mission.participants_count}
                        location={mission.location_needed || ''}
                        imageUrl={mission.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=200&fit=crop'}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                // Enhanced empty state
                <Card className="card-enhanced p-8 text-center">
                  <div className="space-y-3">
                    <Users2 className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                    <h3 className="text-lg font-display text-foreground">No Active Missions</h3>
                    <p className="text-muted-foreground font-body">
                      Check back soon for new missions to join!
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </section>

          {/* Enhanced Call-to-Action Section */}
          <section className="pt-4">
            <Card className="card-enhanced p-6 bg-gradient-to-br from-velyar-soft to-background border-velyar-warm/20">
              <div className="text-center space-y-3">
                <h3 className="text-lg font-display text-velyar-earth">{t("home.readyToShare")}</h3>
                <p className="text-muted-foreground font-body text-sm">
                  {t("home.joinConversation")}
                </p>
                <div className="pt-2">
                  <button 
                    className="btn-primary-enhanced px-6 py-2 rounded-full font-ui text-sm"
                    onClick={handleStartRecording}
                  >
                    {t("home.startRecording")}
                  </button>
                </div>
              </div>
            </Card>
          </section>
        </div>
      </div>
    </PageLayout>
  );
};

export default Home;
