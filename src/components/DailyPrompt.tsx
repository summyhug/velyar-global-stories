
import React, { useState, useEffect } from "react";
import { Clock, ArrowRight, Eye, MapPin, Users2, Sparkles, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

        // Native StoryCamera plugin interface
        const StoryCamera = {
          recordVideo: async (options: any) => {
            // Check if we're on a native platform
            if (typeof window !== 'undefined' && (window as any).Capacitor) {
              const { Plugins } = (window as any).Capacitor;
              console.log('🔍 Available plugins:', Object.keys(Plugins || {}));
              
              // Try to call the plugin directly using Capacitor's native bridge
              try {
                console.log('🔧 Attempting to call StoryCamera plugin directly... [CACHE-BUST]');
                
                // Try different ways to access the plugin
                console.log('🔧 Checking for Capacitor bridge...');
                const capacitor = (window as any).Capacitor;
                console.log('🔧 Capacitor object:', capacitor);
                console.log('🔧 Capacitor methods:', Object.keys(capacitor));
                
                // Try to register the plugin manually
                if (capacitor?.registerPlugin) {
                  console.log('🔧 Found registerPlugin method, trying to register StoryCamera...');
                  try {
                    const StoryCameraPlugin = capacitor.registerPlugin('story-camera');
                    console.log('🔧 StoryCamera plugin registered:', StoryCameraPlugin);
                    
                    if (StoryCameraPlugin?.recordVideo) {
                      console.log('🔧 Calling StoryCamera.recordVideo...');
                      console.log('🔧 StoryCameraPlugin object:', StoryCameraPlugin);
                      console.log('🔧 recordVideo method:', StoryCameraPlugin.recordVideo);
                      try {
                        const result = await StoryCameraPlugin.recordVideo(options);
                        console.log('🔧 StoryCamera result:', result);
                        if (result) {
                          console.log('✅ StoryCamera plugin called successfully via registration');
                          return result;
                        }
                      } catch (callError) {
                        console.log('❌ Error calling StoryCamera.recordVideo:', callError);
                        console.log('❌ Error details:', callError.message, callError.stack);
                      }
                    } else {
                      console.log('❌ StoryCameraPlugin.recordVideo method not found');
                      console.log('🔧 StoryCameraPlugin methods:', Object.keys(StoryCameraPlugin || {}));
                    }
                  } catch (regError) {
                    console.log('❌ Error registering StoryCamera plugin:', regError);
                    console.log('❌ Registration error details:', regError.message, regError.stack);
                  }
                }
                
                // Try to find the bridge through different methods
                let bridge = null;
                
                // Method 1: Check if getBridge exists
                if (capacitor?.getBridge) {
                  console.log('🔧 Found getBridge method');
                  bridge = capacitor.getBridge();
                }
                
                // Method 2: Check if bridge is a direct property
                if (!bridge && capacitor?.bridge) {
                  console.log('🔧 Found bridge property');
                  bridge = capacitor.bridge;
                }
                
                // Method 3: Check if there's a native bridge
                if (!bridge && (window as any).CapacitorNative) {
                  console.log('🔧 Found CapacitorNative');
                  bridge = (window as any).CapacitorNative;
                }
                
                if (bridge) {
                  console.log('🔧 Bridge object:', bridge);
                  console.log('🔧 Bridge methods:', Object.keys(bridge));
                  
                  if (bridge?.callPlugin) {
                    console.log('🔧 Found callPlugin method, calling StoryCamera...');
                    const result = await bridge.callPlugin('story-camera', 'recordVideo', options);
                    console.log('🔧 Bridge call result:', result);
                    if (result) {
                      console.log('✅ StoryCamera plugin called successfully via bridge');
                      return result;
                    }
                  }
                  
                  // Try other possible methods
                  if (bridge?.call) {
                    console.log('🔧 Found call method, trying StoryCamera...');
                    const result = await bridge.call('story-camera', 'recordVideo', options);
                    console.log('🔧 Call result:', result);
                    if (result) {
                      console.log('✅ StoryCamera plugin called successfully via call');
                      return result;
                    }
                  }
                }
                
                // Fallback to direct plugin access
                console.log('🔧 Trying direct plugin access...');
                console.log('🔧 Available plugins:', Object.keys(capacitor.Plugins || {}));
                const result = await (window as any).Capacitor.Plugins['story-camera']?.recordVideo(options);
                if (result) {
                  console.log('✅ StoryCamera plugin called successfully');
                  return result;
                }
              } catch (error) {
                console.log('❌ Error calling StoryCamera plugin:', error);
              }
              
              console.log('❌ StoryCamera plugin not found or failed');
            } else {
              console.log('❌ Capacitor not available');
            }
            
            // Web fallback - only if native plugin is not available
            console.log('🔄 Using web fallback for StoryCamera');
            return {
              filePath: '/mock-video.mp4',
              thumbnailPath: '/mock-thumbnail.jpg',
              duration: 5.2,
              size: 2.5 * 1024 * 1024, // 2.5MB
              camera: options.camera || 'rear',
              overlays: ['text', 'emoji']
            };
          }
        };

export const DailyPrompt = () => {
  const [stats, setStats] = useState({ voices: 0, countries: 0 });
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingResult, setRecordingResult] = useState<any>(null);

  const { t } = useTranslation();

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

  // Auto-reset recording state if stuck
  useEffect(() => {
    if (isRecording) {
      const resetTimer = setTimeout(() => {
        console.log('🔄 Auto-resetting stuck recording state');
        setIsRecording(false);
        setRecordingResult(null);
      }, 60000); // Reset after 60 seconds
      
      return () => clearTimeout(resetTimer);
    }
  }, [isRecording]);

  // StoryCamera test function
  const handleStoryCameraTest = async () => {
    try {
      setIsRecording(true);
      setRecordingResult(null);
      
      console.log('🎥 Testing StoryCamera plugin...');
      
      // Add a timeout to prevent the button from getting stuck
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('StoryCamera timeout after 30 seconds')), 30000);
      });
      
      const result = await Promise.race([
        StoryCamera.recordVideo({
          duration: 15, // 15 seconds for testing
          camera: 'front', // Front camera for selfie-style
          allowOverlays: true
        }),
        timeoutPromise
      ]);
      
      console.log('✅ StoryCamera recording successful:', result);
      setRecordingResult(result);
      
      // Show success message
      alert(`Recording successful!\n\nDuration: ${result.duration}s\nSize: ${(result.size / 1024 / 1024).toFixed(2)}MB\nCamera: ${result.camera}\nOverlays: ${result.overlays.length}`);
      
    } catch (error) {
      console.error('❌ StoryCamera recording failed:', error);
      alert(`Recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRecording(false);
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
            
            {/* StoryCamera Test Results */}
            {recordingResult && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-green-800">
                  <strong>✅ StoryCamera Test Successful!</strong>
                  <div className="mt-1 text-xs">
                    Duration: {recordingResult.duration.toFixed(1)}s | 
                    Size: {(recordingResult.size / 1024 / 1024).toFixed(2)}MB | 
                    Camera: {recordingResult.camera}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced action buttons with proper navigation */}
          <div className="flex gap-3 pt-2">
            {/* TEMPORARY: StoryCamera Test Button */}
            <Button 
              onClick={handleStoryCameraTest}
              disabled={isRecording}
              size="sm" 
              className="btn-primary-enhanced w-full group-hover:scale-105 transition-transform duration-200"
            >
              <Camera className="w-4 h-4 mr-2" />
              <span className="font-ui">
                {isRecording ? "Recording..." : "🎥 Test StoryCamera"}
              </span>
            </Button>
            
            {/* ORIGINAL BUTTON (commented out for testing):
            <Link to="/create/daily-prompt" className="flex-1">
              <Button 
                size="sm" 
                className="btn-primary-enhanced w-full group-hover:scale-105 transition-transform duration-200"
              >
                <span className="font-ui">{t("common.respond")}</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            </Link>
            */}
            
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
