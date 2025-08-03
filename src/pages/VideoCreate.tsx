
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
  const [step, setStep] = useState<'record' | 'edit'>(() => {
    return localStorage.getItem('videoCreate_step') as 'record' | 'edit' || 'record';
  });
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [caption, setCaption] = useState(() => {
    return localStorage.getItem('videoCreate_caption') || "";
  });
  const [location, setLocation] = useState(() => {
    return localStorage.getItem('videoCreate_location') || "";
  });
  const [videoDuration, setVideoDuration] = useState(0);
  const [textOverlays, setTextOverlays] = useState([]);
  const [currentPrompt, setCurrentPrompt] = useState<{ text: string; theme_id: string; theme_name: string; type: 'daily' | 'mission'; title?: string } | null>(null);
  const { missionId } = useParams();
  const { isNative, recordVideo, getCurrentLocation } = useMobile();
  
  console.log('VideoCreate: isNative =', isNative, 'platform:', Capacitor.getPlatform());
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
        const today = new Date().toISOString().split('T')[0];
        const { data: promptData } = await supabase
          .from('daily_prompts')
          .select(`
            prompt_text,
            theme_id,
            themes:theme_id (
              name
            )
          `)
          .eq('date', today)
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

  // Check if we need to reset to capture screen after app restart
  useEffect(() => {
    const hasVideoData = localStorage.getItem('videoCreate_hasVideo');
    if (hasVideoData === 'true' && step === 'edit' && !recordedVideo && !videoFile) {
      // Video was lost due to app restart, go back to capture
      setStep('record');
      localStorage.removeItem('videoCreate_hasVideo');
    }
  }, []);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('videoCreate_step', step);
  }, [step]);

  useEffect(() => {
    if (recordedVideo) {
      localStorage.setItem('videoCreate_recordedVideo', recordedVideo);
    }
  }, [recordedVideo]);

  useEffect(() => {
    localStorage.setItem('videoCreate_caption', caption);
  }, [caption]);

  useEffect(() => {
    localStorage.setItem('videoCreate_location', location);
  }, [location]);

  // Clear localStorage when leaving the page or submitting
  const clearVideoState = () => {
    localStorage.removeItem('videoCreate_step');
    localStorage.removeItem('videoCreate_recordedVideo');
    localStorage.removeItem('videoCreate_caption');
    localStorage.removeItem('videoCreate_location');
    localStorage.removeItem('videoCreate_hasVideo');
  };

  const startNativeRecording = async () => {
    try {
      console.log('Starting native recording, platform:', Capacitor.getPlatform());
      
      // Force camera recording on mobile platforms
      if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
        console.log('Attempting to use native video recording...');
        const videoResult = await recordVideo();
        console.log('Video recording result:', videoResult);
        
        setRecordedVideo(videoResult.url);
        setVideoFile(videoResult.file);
        localStorage.setItem('videoCreate_hasVideo', 'true');
        setVideoDuration(30);
        setStep('edit');
        
        // Try to get current location
        try {
          const coords = await getCurrentLocation();
          setLocation(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        } catch (error) {
          console.log('Location access denied or unavailable');
        }
      } else {
        console.log('Web platform detected, using file upload');
        document.getElementById('video-file-input')?.click();
      }
    } catch (error) {
      console.error('Video recording failed:', error);
      console.log('Falling back to file upload due to error');
      document.getElementById('video-file-input')?.click();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setRecordedVideo(url);
      setVideoFile(file);
      localStorage.setItem('videoCreate_hasVideo', 'true');
      setVideoDuration(30); // Mock duration
      setStep('edit');
    }
  };

  const handleSubmit = async () => {
    if (!recordedVideo || !videoFile) {
      console.error('Missing video or file');
      return;
    }

    try {
      console.log('Starting video submission process...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        alert('Please log in to upload videos');
        return;
      }

      console.log('User authenticated:', user.id);

      // Upload video to Supabase storage
      const fileName = `${user.id}/${Date.now()}.${videoFile.name.split('.').pop() || 'mp4'}`;
      console.log('Uploading file:', fileName, 'Size:', videoFile.size);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, videoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert(`Upload failed: ${uploadError.message}`);
        return;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL for the uploaded video
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      console.log('Public URL generated:', publicUrl);

      // Create video record with storage URL
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          video_url: publicUrl,
          title: caption || 'Daily Prompt Response',
          description: caption,
          location: location || null,
          daily_prompt_id: currentPrompt ? await getCurrentPromptId() : null,
          is_public: true
        })
        .select()
        .single();

      if (videoError) {
        console.error('Database error:', videoError);
        alert(`Database error: ${videoError.message}`);
        return;
      }

      console.log('Video record created:', videoData);

      // If there's a current prompt with a theme, assign the theme to the video
      if (currentPrompt && currentPrompt.theme_id && videoData) {
        console.log('Adding theme to video...');
        const { error: themeError } = await supabase
          .from('video_themes')
          .insert({
            video_id: videoData.id,
            theme_id: currentPrompt.theme_id
          });
        
        if (themeError) {
          console.error('Theme assignment error:', themeError);
          // Don't block the submission for this
        }
      }

      console.log('Video submission complete, navigating to home...');
      clearVideoState();
      navigate('/');
    } catch (error) {
      console.error('Error submitting video:', error);
      alert(`An error occurred: ${error.message || 'Unknown error'}`);
      // Don't reset to capture screen on error - stay on edit screen
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
      clearVideoState();
      navigate(-1);
    } else if (step === 'edit') {
      setStep('record');
    }
  };

  return (
    <div className="min-h-screen-safe bg-background font-quicksand safe-area-inset">
      {/* Header */}
      <header className="sticky-header header-safe">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
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
      <main className="max-w-md mx-auto px-4 content-safe-bottom">
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
                        capture="environment"
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
                <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden mb-4">
                  {recordedVideo ? (
                    <video 
                      src={recordedVideo} 
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                      muted
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Video className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
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
