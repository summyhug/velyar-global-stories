
import { useState, useEffect } from "react";
import { ArrowRight, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const DailyPrompt = () => {
  const [stats, setStats] = useState({ voices: 0, countries: 0 });
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("what did you eat last night?");

  useEffect(() => {
    const fetchPromptData = async () => {
      try {
        // Get today's active daily prompt
        const today = new Date().toISOString().split('T')[0];
        const { data: todayPrompt } = await supabase
          .from('daily_prompts')
          .select('id, prompt_text')
          .eq('date', today)
          .eq('is_active', true)
          .single();

        if (todayPrompt) {
          setPrompt(todayPrompt.prompt_text);
          
          // Get videos for today's prompt
          const { data: videos } = await supabase
            .from('videos')
            .select('id, location')
            .eq('daily_prompt_id', todayPrompt.id)
            .eq('is_public', true);

          const voiceCount = videos?.length || 0;
          const countrySet = new Set(
            videos
              ?.map(video => video.location)
              .filter(location => location && location.trim() !== '')
              .map(location => location.split(',').pop()?.trim().toLowerCase())
              .filter(Boolean)
          );

          setStats({ voices: voiceCount, countries: countrySet.size });
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
              ? `join ${stats.voices.toLocaleString()} voices from ${stats.countries} countries sharing their evening meals`
              : "be the first to share your evening meal"
          }
        </p>
        
        <div className="flex gap-3">
          <Link to="/create" className="flex-1">
            <Button 
              className="w-full bg-velyar-earth hover:bg-velyar-warm transition-colors"
              size="lg"
            >
              share
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/videos/daily-prompt" className="flex-1">
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
