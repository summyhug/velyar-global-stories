
import React, { useState, useEffect } from "react";
import { Clock, ArrowRight, Eye, MapPin, Users2, Sparkles, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import StoryCamera from "../../StoryCamera";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const DailyPrompt = () => {
  const [stats, setStats] = useState({ voices: 0, countries: 0 });
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPromptData = async () => {
      try {
        // Get today's active daily prompt first, then fall back to most recent active
        const today = new Date().toISOString().split('T')[0];
        console.log('DailyPrompt: Looking for prompt for date:', today);
        
        let { data: todayPrompt, error: todayError } = await supabase
          .from('daily_prompts')
          .select('id, prompt_text')
          .eq('date', today)
          .eq('is_active', true)
          .maybeSingle();
          
        if (todayError) {
          console.error('DailyPrompt: Error fetching today\'s prompt:', todayError);
        }

        // If no prompt for today, get the most recent active prompt
        if (!todayPrompt) {
          console.log('DailyPrompt: No prompt for today, fetching most recent active prompt');
          const { data: recentPrompt, error: recentError } = await supabase
            .from('daily_prompts')
            .select('id, prompt_text')
            .eq('is_active', true)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (recentError) {
            console.error('DailyPrompt: Error fetching recent prompt:', recentError);
          }
          
          todayPrompt = recentPrompt;
          console.log('DailyPrompt: Found recent prompt:', recentPrompt);
        }

        if (todayPrompt) {
          console.log('DailyPrompt: Found today\'s prompt:', todayPrompt.id, todayPrompt.prompt_text);
          setPrompt(todayPrompt.prompt_text);
          setCurrentPromptId(todayPrompt.id);
          
          // Get videos for today's prompt
          const { data: videos } = await supabase
            .from('videos')
            .select('id, location, daily_prompt_id')
            .eq('daily_prompt_id', todayPrompt.id)
            .eq('is_public', true)
            .eq('is_hidden', false);

          console.log('DailyPrompt: Found videos for prompt', todayPrompt.id, ':', videos?.length || 0);
          console.log('DailyPrompt: Video IDs:', videos?.map(v => v.id) || []);
          
          const voiceCount = videos?.length || 0;
          const countrySet = new Set(
            videos
              ?.map(video => video.location)
              .filter(location => location && location.trim() !== '')
              .map(location => location.split(',').pop()?.trim().toLowerCase())
              .filter(Boolean)
          );

          setStats({ voices: voiceCount, countries: countrySet.size });
        } else {
          // Fallback prompt if no active prompt found
          console.log('DailyPrompt: No active prompt found, using fallback');
          setPrompt("what did you eat last night?");
        }
      } catch (error) {
        console.error('Error fetching prompt data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPromptData();
  }, []);


  // Direct StoryCamera recording function
  const handleRespondWithStoryCamera = async () => {
    try {
      console.log('🎬 ===== DAILYPROMPT: STARTING STORYCAMERA =====');
      console.log('DailyPrompt: About to call StoryCamera.recordVideo...');
      console.log('DailyPrompt: StoryCamera object:', StoryCamera);
      console.log('DailyPrompt: StoryCamera.recordVideo method:', StoryCamera.recordVideo);
      console.log('DailyPrompt: StoryCamera.recordVideo type:', typeof StoryCamera.recordVideo);
      console.log('DailyPrompt: StoryCamera keys:', Object.keys(StoryCamera));
      console.log('DailyPrompt: StoryCamera constructor:', StoryCamera.constructor.name);
      
      // Check if the method exists
      if (typeof StoryCamera.recordVideo !== 'function') {
        throw new Error('StoryCamera.recordVideo is not a function. Available methods: ' + Object.keys(StoryCamera).join(', '));
      }
      
      
      const storyResult = await StoryCamera.recordVideo({
        duration: 30,
        camera: 'rear',
        allowOverlays: true,
        promptName: prompt || "Daily Prompt",
        contextType: 'daily',
        promptId: currentPromptId || undefined
      });
      
      // Try to navigate using plugin result first
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
        const target = '/record-test?filePath=' + encodeURIComponent(fp) + (currentPromptId ? ('&promptId=' + encodeURIComponent(currentPromptId)) : '');
        setTimeout(() => {
          navigate(target, { 
            state: { 
              filePath: fp, 
              promptId: storyResult.promptId || currentPromptId,
              contextType: storyResult.contextType
            } 
          });
        }, 0);
      } else {
        console.warn('DailyPrompt: Could not determine filePath after recording');
      }
      
    } catch (error) {
      console.error('❌ ===== DAILYPROMPT: STORYCAMERA FAILED =====');
      console.error('DailyPrompt: StoryCamera failed:', error);
      console.error('DailyPrompt: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      console.error('StoryCamera FAILED! Error: ' + error.message);
      
      // Show error message to user instead of redirecting to dead end
      toast({
        title: "Camera Error",
        description: "Failed to open camera. Please try again.",
        variant: "destructive",
      });
      
    } finally {
      // Recording completed or failed
    }
  };

  return (
    <Card 
      className="card-interactive group overflow-hidden border-velyar-warm/30 bg-gradient-to-br from-velyar-soft/50 to-background"
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with enhanced typography */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-velyar-earth/10 rounded-full">
                <Clock className="w-4 h-4 text-velyar-earth group-hover:animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-ui text-muted-foreground uppercase tracking-wide">Daily Global Prompt</h3>
                <p className="text-xs text-muted-foreground">Updated every 24 hours</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-velyar-warm/20 text-velyar-earth border-velyar-warm/30">
              Live
            </Badge>
          </div>

          {/* Enhanced prompt text */}
          <div className="space-y-3">
            <h2 className="text-xl font-display text-foreground leading-tight group-hover:text-velyar-earth transition-colors duration-200">
              {prompt}
            </h2>
            
            {/* Enhanced stats with better visual hierarchy */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span className="font-ui">{loading ? t("common.loading") : stats.voices.toLocaleString()}</span>
                <span>{t("common.participants")}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="font-ui">{loading ? "loading..." : `${stats.countries} countries`}</span>
              </div>
            </div>
            
          </div>

          {/* Enhanced action buttons with direct StoryCamera integration */}
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={handleRespondWithStoryCamera}
              size="sm" 
              className="btn-primary-enhanced w-full group-hover:scale-105 transition-transform duration-200"
            >
              <Camera className="w-4 h-4 mr-2" />
              <span className="font-ui">
                {t("common.respond")}
              </span>
            </Button>
            
            <Link to={currentPromptId ? `/video-list/daily-prompt/${currentPromptId}` : "/video-list/daily-prompt"} className="flex-1">
              <Button 
                variant="outline" 
                size="sm" 
                className="btn-secondary-enhanced w-full group-hover:scale-105 transition-transform duration-200"
              >
                <Eye className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-ui">{t("common.view")}</span>
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
