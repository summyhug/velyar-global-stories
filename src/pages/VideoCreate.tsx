
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Camera, Video, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { VideoTextOverlay } from "@/components/VideoTextOverlay";
import { useNavigate, useParams } from "react-router-dom";
import { generateVideoThumbnail, uploadThumbnailToStorage } from "@/utils/videoThumbnail";
import { compressVideo, getVideoInfo } from "@/utils/videoCompression";
import { supabase } from "@/integrations/supabase/client";
import { useMobile } from "@/hooks/useMobile";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Capacitor } from "@capacitor/core";
import { validateVideoContent, getContentViolationMessage } from "@/utils/contentModeration";
import { useVideoCreate } from "@/contexts/VideoCreateContext";

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
  const [currentPrompt, setCurrentPrompt] = useState<{ text: string; theme_id: string; theme_name: string; type: 'daily' | 'mission'; title?: string; id?: string } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const MAX_RECORDING_TIME = 30; // 30 seconds
  const MAX_FILE_SIZE_MB = 50; // 50MB after compression
  const { missionId } = useParams();
  const { isNative, recordVideo, getCurrentLocation } = useMobile();
  const { toast } = useToast();
  const { setIsEditing } = useVideoCreate();
  const { user } = useAuth();
  const { location: userLocation } = useProfile(user?.id);
  
  console.log('VideoCreate: isNative =', isNative, 'platform:', Capacitor.getPlatform());
  const navigate = useNavigate();

  // Fetch current prompt or mission on component mount
  useEffect(() => {
    const fetchContent = async () => {
      if (missionId) {
        // Fetch mission data with theme
        const { data: missionData } = await supabase
          .from('missions')
          .select(`
            title, 
            description, 
            target_regions, 
            theme_id,
            themes:theme_id (
              name
            )
          `)
          .eq('id', missionId)
          .single();

        if (missionData) {
          setCurrentPrompt({
            text: missionData.description,
            theme_id: missionData.theme_id || '',
            theme_name: missionData.themes?.name || 'No theme',
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
            id,
            prompt_text,
            theme_id,
            themes:theme_id (
              name
            )
          `)
          .eq('date', today)
          .eq('is_active', true)
          .single();

        if (promptData) {
          setCurrentPrompt({
            text: promptData.prompt_text,
            theme_id: promptData.theme_id,
            theme_name: promptData.themes?.name || 'No theme',
            type: 'daily',
            id: promptData.id
          });
        }
      }
    };
    
    fetchContent();
  }, [missionId]);

  // Set user's profile location when component mounts or user location changes
  useEffect(() => {
    console.log('VideoCreate: userLocation:', userLocation);
    console.log('VideoCreate: current location state:', location);
    console.log('VideoCreate: user:', user?.id);
    
    if (userLocation && !location) {
      console.log('VideoCreate: Setting user profile location:', userLocation);
      setLocation(userLocation);
    }
  }, [userLocation, location, user]);

  // Check if we need to reset to capture screen after app restart
  useEffect(() => {
    console.log('VideoCreate: Component mounted/updated');
    console.log('VideoCreate: Current step:', step);
    console.log('VideoCreate: recordedVideo exists:', !!recordedVideo);
    console.log('VideoCreate: videoFile exists:', !!videoFile);
    
    const hasVideoData = localStorage.getItem('videoCreate_hasVideo');
    const savedStep = localStorage.getItem('videoCreate_step');
    
    console.log('VideoCreate: localStorage hasVideo:', hasVideoData);
    console.log('VideoCreate: localStorage step:', savedStep);
    
    if (hasVideoData === 'true' && savedStep === 'edit' && !recordedVideo && !videoFile) {
      console.log('VideoCreate: Video was lost due to app restart, resetting to capture');
      setStep('record');
      localStorage.removeItem('videoCreate_hasVideo');
      localStorage.removeItem('videoCreate_step');
    }
  }, [recordedVideo, videoFile, step]);

  // Persist state to localStorage with logging
  useEffect(() => {
    console.log('VideoCreate: Persisting step to localStorage:', step);
    localStorage.setItem('videoCreate_step', step);
    
    // Update global editing state
    setIsEditing(step === 'edit');
  }, [step, setIsEditing]);

  useEffect(() => {
    if (recordedVideo) {
      console.log('VideoCreate: Persisting recordedVideo existence to localStorage');
      localStorage.setItem('videoCreate_hasVideo', 'true');
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
    console.log('VideoCreate: Clearing localStorage state');
    localStorage.removeItem('videoCreate_step');
    localStorage.removeItem('videoCreate_recordedVideo');
    localStorage.removeItem('videoCreate_caption');
    localStorage.removeItem('videoCreate_location');
    localStorage.removeItem('videoCreate_hasVideo');
    setIsEditing(false);
  };

  const startNativeRecording = async () => {
    try {
      console.log('VideoCreate: Starting native recording');
      console.log('VideoCreate: Platform:', Capacitor.getPlatform());
      console.log('VideoCreate: isNative:', isNative);
      
      // Force camera recording on mobile platforms
      if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
        console.log('VideoCreate: Attempting native video recording...');
        
        // Add timeout to handle cases where the file chooser doesn't respond
        const recordingPromise = recordVideo();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Recording timeout')), 30000); // 30 second timeout
        });
        
        const videoResult = await Promise.race([recordingPromise, timeoutPromise]) as { file: File; url: string };
        
        console.log('VideoCreate: Video recording result:', {
          hasFile: !!videoResult.file,
          hasUrl: !!videoResult.url,
          fileSize: videoResult.file?.size || 0,
          fileName: videoResult.file?.name || 'unknown',
          fileType: videoResult.file?.type || 'unknown'
        });
        
        console.log('VideoCreate: Setting video state and moving to edit step');
        setRecordedVideo(videoResult.url);
        setVideoFile(videoResult.file);
        localStorage.setItem('videoCreate_hasVideo', 'true');
        setVideoDuration(30);
        setStep('edit');
      } else {
        console.log('VideoCreate: Web platform detected, using file upload');
        document.getElementById('video-file-input')?.click();
      }
    } catch (error) {
      console.error('VideoCreate: Video recording failed:', error);
      console.log('VideoCreate: Falling back to file upload due to error');
      document.getElementById('video-file-input')?.click();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      console.log('VideoCreate: File upload - file selected:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Get video info first
      const videoInfo = await getVideoInfo(file);
      
      // Check duration limit
      if (videoInfo.duration > MAX_RECORDING_TIME) {
        toast({
          title: "Video too long",
          description: `Please record a video under ${MAX_RECORDING_TIME} seconds. Current: ${Math.round(videoInfo.duration)}s`,
          variant: "destructive",
        });
        return;
      }

      // Check if compression is needed
      const fileSizeMB = file.size / (1024 * 1024);
      
      // Navigate to edit step immediately
      const url = URL.createObjectURL(file);
      setRecordedVideo(url);
      setVideoFile(file); // Use original file initially
      localStorage.setItem('videoCreate_hasVideo', 'true');
      setVideoDuration(videoInfo.duration);
      setStep('edit');
      console.log('VideoCreate: File upload complete, moved to edit step');
      
      // Compress in background if needed
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        setIsCompressing(true);
        toast({
          title: "Compressing video",
          description: "Large video detected, compressing in background...",
        });
        
        // Compress in background
        compressVideo(file, {
          maxSizeMB: MAX_FILE_SIZE_MB,
          maxWidthOrHeight: 1280,
        }).then((compressedFile) => {
          // Update with compressed file
          const compressedUrl = URL.createObjectURL(compressedFile);
          setRecordedVideo(compressedUrl);
          setVideoFile(compressedFile);
          setIsCompressing(false);
          
          toast({
            title: "Video compressed",
            description: `Size reduced from ${fileSizeMB.toFixed(1)}MB to ${(compressedFile.size / (1024 * 1024)).toFixed(1)}MB`,
          });
        }).catch((compressionError) => {
          console.error('Compression failed:', compressionError);
          setIsCompressing(false);
          toast({
            title: "Compression failed",
            description: "Video will be uploaded as-is",
            variant: "destructive",
          });
        });
      }
    } catch (error) {
      console.error('Error processing video:', error);
      toast({
        title: "Error processing video",
        description: "Please try again with a different video",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!recordedVideo || !videoFile) {
      toast({
        title: "No video selected",
        description: "Please record or upload a video first",
        variant: "destructive",
      });
      return;
    }

    // Validate content before upload
    const contentValidation = validateVideoContent(caption, location);
    if (!contentValidation.isValid) {
      toast({
        title: "Content policy violation",
        description: contentValidation.message,
        variant: "destructive",
      });
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

      // Generate thumbnail first
      let thumbnailUrl = null;
      try {
        console.log('Generating video thumbnail...');
        console.log('Video file details:', {
          name: videoFile.name,
          size: videoFile.size,
          type: videoFile.type
        });
        
        const thumbnail = await generateVideoThumbnail(videoFile, 2);
        console.log('Thumbnail generated successfully, uploading to storage...');
        thumbnailUrl = await uploadThumbnailToStorage(thumbnail, `${user.id}_${Date.now()}`);
        console.log('Thumbnail generated and uploaded:', thumbnailUrl);
        
        // Show success message
        toast({
          title: "Thumbnail generated",
          description: "Video thumbnail created successfully",
          duration: 2000,
        });
      } catch (error) {
        console.error('Thumbnail generation failed:', error);
        console.error('Error message:', error?.message || 'No message');
        console.error('Error string:', JSON.stringify(error, null, 2));
        
        // Show error toast
        toast({
          title: "Thumbnail generation failed", 
          description: error?.message || "Video will be uploaded without thumbnail",
          variant: "destructive",
          duration: 3000,
        });
        // Continue without thumbnail
      }

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
        console.error('Upload error message:', uploadError?.message || 'No message');
        console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
        console.error('File size:', videoFile.size, 'bytes');
        console.error('File type:', videoFile.type);
        
        toast({
          title: "Video upload failed",
          description: uploadError?.message || "Unknown upload error",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL for the uploaded video
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      console.log('Public URL generated:', publicUrl);

      // Get current prompt ID if responding to daily prompt
      let promptId = null;
      if (currentPrompt && currentPrompt.type === 'daily') {
        promptId = currentPrompt.id;
        console.log('Using stored daily prompt ID for video:', promptId);
      }

      // Create video record with storage URL
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          video_url: publicUrl,
          thumbnail_url: thumbnailUrl,
          title: caption || (currentPrompt?.type === 'mission' ? 'Mission Response' : 'Daily Prompt Response'),
          description: caption,
          location: location || null,
          daily_prompt_id: promptId,
          mission_id: missionId || null,
          is_public: true,
          moderation_status: 'approved' // Content passed basic filtering
        })
        .select()
        .single();

      if (videoError) {
        console.error('Database error:', videoError);
        alert(`Database error: ${videoError.message}`);
        return;
      }

      console.log('Video record created:', videoData);

      // If there's a current prompt or mission with a theme, assign the theme to the video
      if (currentPrompt && currentPrompt.theme_id && videoData) {
        console.log('Adding theme to video...', {
          videoId: videoData.id,
          themeId: currentPrompt.theme_id,
          promptType: currentPrompt.type
        });
        const { error: themeError } = await supabase
          .from('video_themes')
          .insert({
            video_id: videoData.id,
            theme_id: currentPrompt.theme_id
          });
        
        if (themeError) {
          console.error('Theme assignment error:', themeError);
          // Don't block the submission for this
        } else {
          console.log('Theme assigned successfully');
        }
      }

      console.log('Video submission complete, showing success message...');
      
      // Show success toast
      toast({
        title: "Video uploaded successfully!",
        description: "Your video has been saved and will appear in the feed.",
        duration: 3000,
      });
      
      // Clear state and navigate home after a brief delay
      setTimeout(() => {
        clearVideoState();
        navigate('/');
      }, 1500);
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
    <div className="min-h-screen-safe bg-background font-quicksand">
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
                <p className="text-muted-foreground mb-4">
                  {isNative ? 'tap to open your camera and record a video' : 'use the file upload to share a video'}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  ⏱️ Maximum duration: {MAX_RECORDING_TIME} seconds | 📁 Videos will be compressed if over {MAX_FILE_SIZE_MB}MB
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
                        disabled={isCompressing}
                      />
                      <Button variant="outline" className={`w-full ${isCompressing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <Upload className="w-5 h-5 mr-2" />
                        {isCompressing ? 'processing...' : 'or upload video'}
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
              disabled={!videoFile || !caption.trim() || !location.trim() || isCompressing}
              className="w-full bg-velyar-earth hover:bg-velyar-warm text-white font-nunito font-medium disabled:opacity-50"
            >
              {isCompressing ? "compressing..." : "share"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default VideoCreate;
