
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Camera, Video, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { VideoTextOverlay } from "@/components/VideoTextOverlay";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useMobile } from "@/hooks/useMobile";
import { Capacitor } from "@capacitor/core";

const VideoCreate = () => {
  const [step, setStep] = useState<'record' | 'edit'>('record');
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [textOverlays, setTextOverlays] = useState([]);
  const [currentPrompt, setCurrentPrompt] = useState<{ text: string; theme_id: string; theme_name: string; type: 'daily' | 'mission'; title?: string } | null>(null);
  const { missionId } = useParams();
  const { isNative, recordVideo, getCurrentLocation } = useMobile();
  
  console.log('VideoCreate: isNative =', isNative); // Debug log
  const navigate = useNavigate();

  // Fetch current prompt or mission on component mount
  useEffect(() => {
    const fetchContent = async () => {
      if (missionId) {
        // Fetch mission data
        const { data: missionData } = await supabase
          .from('missions')
          .select('title, description, target_regions')
          .eq('id', missionId)
          .single();

        if (missionData) {
          setCurrentPrompt({
            text: missionData.description,
            theme_id: '',
            theme_name: 'nature', // Default theme for missions
            type: 'mission',
            title: missionData.title
          });
        }
      } else {
        // Fetch daily prompt
        const { data: promptData } = await supabase
          .from('daily_prompts')
          .select(`
            prompt_text,
            theme_id,
            themes:theme_id (
              name
            )
          `)
          .eq('is_active', true)
          .single();

        if (promptData && promptData.themes) {
          setCurrentPrompt({
            text: promptData.prompt_text,
            theme_id: promptData.theme_id,
            theme_name: promptData.themes.name,
            type: 'daily'
          });
        }
      }
    };
    
    fetchContent();
  }, [missionId]);

  const startNativeRecording = async () => {
    try {
      console.log('Starting native recording, isNative:', isNative, 'platform:', Capacitor.getPlatform());
      
      // Force use mobile camera if we're on mobile platform
      if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
        const videoPath = await recordVideo();
        console.log('Video recording result:', videoPath);
        
        if (videoPath) {
          setRecordedVideo(videoPath);
          setVideoDuration(30);
          setStep('edit');
          
          // Try to get current location
          try {
            const coords = await getCurrentLocation();
            setLocation(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
          } catch (error) {
            console.log('Location access denied or unavailable');
          }
        }
      } else {
        console.log('Not on mobile platform, showing file upload');
        // Trigger file input on web
        document.getElementById('video-file-input')?.click();
      }
    } catch (error) {
      console.error('Video recording failed:', error);
      // Fallback to file upload if camera fails
      document.getElementById('video-file-input')?.click();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setRecordedVideo(url);
      setVideoDuration(30); // Mock duration
      setStep('edit');
    }
  };

  const handleSubmit = async () => {
    if (!recordedVideo) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      // Create video record
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          video_url: recordedVideo,
          title: caption || 'Daily Prompt Response',
          description: caption,
          location: location || null,
          daily_prompt_id: currentPrompt ? await getCurrentPromptId() : null,
          is_public: true
        })
        .select()
        .single();

      if (videoError) throw videoError;

      // If there's a current prompt with a theme, assign the theme to the video
      if (currentPrompt && currentPrompt.theme_id && videoData) {
        await supabase
          .from('video_themes')
          .insert({
            video_id: videoData.id,
            theme_id: currentPrompt.theme_id
          });
      }

      navigate('/');
    } catch (error) {
      console.error('Error submitting video:', error);
    }
  };

  const getCurrentPromptId = async () => {
    const { data } = await supabase
      .from('daily_prompts')
      .select('id')
      .eq('is_active', true)
      .single();
    return data?.id;
  };

  const handleBack = () => {
    if (step === 'record') {
      navigate(-1);
    } else if (step === 'edit') {
      setStep('record');
    }
  };

  return (
    <div className="min-h-screen bg-background font-quicksand safe-area-inset">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3 pt-safe-top">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="p-2 text-velyar-earth hover:bg-velyar-soft"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-medium text-velyar-earth font-nunito">share your story</h1>
        </div>
      </header>

      {/* Current Prompt Banner */}
      {currentPrompt && (
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="bg-velyar-soft/50 rounded-lg p-4 border border-velyar-earth/10">
            <p className="text-xs text-velyar-earth/70 mb-1 font-nunito">
              {currentPrompt.type === 'mission' ? 'mission' : "today's prompt"} • {currentPrompt.theme_name} theme
            </p>
            {currentPrompt.type === 'mission' && currentPrompt.title && (
              <p className="text-sm text-velyar-earth/80 mb-2 font-nunito font-medium">{currentPrompt.title}</p>
            )}
            <p className="text-velyar-earth font-medium">{currentPrompt.text}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pb-safe-bottom">
        {step === 'record' && (
          <div className="mt-8 space-y-6">
            <Card className="border-velyar-earth/10">
              <CardContent className="p-6 text-center">
                <div className="text-6xl mb-4">🎥</div>
                <h2 className="text-velyar-earth font-nunito font-medium text-lg mb-4">record your story</h2>
                <p className="text-muted-foreground mb-6">
                  {isNative ? 'tap to open your camera and record a video' : 'use the file upload to share a video'}
                </p>
                <div className="space-y-4">
                  <Button
                    onClick={startNativeRecording}
                    className="w-full bg-velyar-warm hover:bg-velyar-glow text-velyar-earth font-nunito font-medium"
                  >
                    <Video className="w-5 h-5 mr-2" />
                    record video
                  </Button>
                  <div className="relative">
                    <input
                      id="video-file-input"
                      type="file"
                      accept="video/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button variant="outline" className="w-full">
                      <Upload className="w-5 h-5 mr-2" />
                      or upload video
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'edit' && (
          <div className="mt-8 space-y-6">
            <Card className="border-velyar-earth/10">
              <CardContent className="p-4">
                <div className="aspect-[9/16] bg-muted rounded-lg flex items-center justify-center mb-4">
                  <Video className="w-16 h-16 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-velyar-earth/10">
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label htmlFor="caption" className="text-velyar-earth font-nunito">caption</Label>
                  <Textarea
                    id="caption"
                    placeholder="tell us about your story..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="mt-2 border-velyar-earth/20 focus:border-velyar-earth"
                  />
                </div>
                <div>
                  <Label htmlFor="location" className="text-velyar-earth font-nunito">location</Label>
                  <Input
                    id="location"
                    placeholder="city, country"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-2 border-velyar-earth/20 focus:border-velyar-earth"
                  />
                </div>
              </CardContent>
            </Card>

            <VideoTextOverlay
              videoDuration={videoDuration}
              onTextOverlaysChange={setTextOverlays}
            />

            <Button 
              onClick={handleSubmit}
              className="w-full bg-velyar-warm hover:bg-velyar-glow text-velyar-earth font-nunito font-medium"
            >
              share your story
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default VideoCreate;
