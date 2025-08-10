
import { useState, useEffect } from "react";
import { ArrowRight, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const DailyPrompt = () => {
  const [stats, setStats] = useState({ voices: 0, countries: 0 });
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);

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
            .eq('is_public', true);

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
  return (
    <Card className="mt-6 bg-gradient-soft border-0 shadow-gentle">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-velyar-earth" />
          <span className="text-sm text-muted-foreground">today's global prompt</span>
        </div>
        
        <h2 className="text-xl font-medium text-foreground mb-4 leading-relaxed font-nunito">
          "{prompt}"
        </h2>
        
        <p className="text-sm text-muted-foreground mb-6">
          {loading 
            ? "loading participation..." 
            : stats.voices > 0 
              ? `join ${stats.voices.toLocaleString()} voices from ${stats.countries} countries sharing their stories`
              : "be the first to share your story"
          }
        </p>
        
        <div className="flex gap-3">
          <Link to="/create/daily-prompt" className="flex-1">
            <Button 
              className="w-full bg-velyar-earth hover:bg-velyar-warm transition-colors"
              size="lg"
            >
              share
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to={currentPromptId ? `/video-list/daily-prompt/${currentPromptId}` : "/video-list/daily-prompt"} className="flex-1" onClick={() => console.log('DailyPrompt: View button clicked, navigating to:', currentPromptId ? `/video-list/daily-prompt/${currentPromptId}` : "/video-list/daily-prompt")}>
            <Button 
              variant="outline"
              className="w-full"
              size="lg"
            >
              view
              <Eye className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
