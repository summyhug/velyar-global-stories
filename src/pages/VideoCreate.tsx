
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Camera, Video, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { VideoTextOverlay } from "@/components/VideoTextOverlay";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { generateVideoThumbnail, uploadThumbnailToStorage } from "@/utils/videoThumbnail";
import { compressVideo, getVideoInfo } from "@/utils/videoCompression";
import { supabase } from "@/integrations/supabase/client";
import { useMobile } from "@/hooks/useMobile";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Capacitor } from "@capacitor/core";
import { validateVideoContent, getContentViolationMessage } from "@/utils/contentModeration";
import { useVideoCreate } from "@/contexts/VideoCreateContext";
import StoryCamera from "../../StoryCamera";

const VideoCreate = () => {
  const { t } = useTranslation();
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const MAX_RECORDING_TIME = 30; // 30 seconds
  const MAX_FILE_SIZE_MB = 50; // 50MB after compression
  const { missionId } = useParams<{ missionId?: string }>();
  const { isNative, recordVideo, getCurrentLocation } = useMobile();
  const { toast } = useToast();
  const { setIsEditing } = useVideoCreate();
  const { user } = useAuth();
  const { location: userLocation } = useProfile(user?.id);
  const routerLocation = useLocation();
  
  console.log('VideoCreate: isNative =', isNative, 'platform:', Capacitor.getPlatform());
  console.log('VideoCreate: missionId from params =', missionId);
  console.log('VideoCreate: location state =', routerLocation.state);
  const navigate = useNavigate();

  // Handle pre-recorded video from DailyPrompt or Mission
  useEffect(() => {
    if (routerLocation.state?.recordedVideo) {
      console.log('VideoCreate: Received pre-recorded video:', routerLocation.state.recordedVideo);
      const recordedVideoData = routerLocation.state.recordedVideo;
      
      // Convert the StoryCamera result to the expected format
      if (recordedVideoData.filePath) {
        // For now, create a mock file since we have the file path
        const mockFile = new File([''], `story_${Date.now()}.mp4`, { type: 'video/mp4' });
        const url = URL.createObjectURL(mockFile);
        
        setRecordedVideo(url);
        setVideoFile(mockFile);
        setVideoDuration(recordedVideoData.duration || 30);
        setStep('edit');
        localStorage.setItem('videoCreate_hasVideo', 'true');
        
        console.log('VideoCreate: Set pre-recorded video and moved to edit step');
      }
    }
  }, [routerLocation.state]);

  // Fetch current prompt or mission on component mount
  useEffect(() => {
    const fetchContent = async () => {
      console.log('🎬 VideoCreate: fetchContent called with missionId =', missionId);
      console.log('🎬 VideoCreate: URL path:', window.location.pathname);
      if (missionId) {
        console.log('🎯 MISSION MODE: missionId detected, fetching mission data...');
        // Check if mission data was passed from MissionCard
        if (routerLocation.state?.missionData) {
          console.log('VideoCreate: Using mission data from state:', routerLocation.state.missionData);
          const missionData = routerLocation.state.missionData;
          
          // Fetch theme information for the mission
          const { data: missionWithTheme } = await supabase
            .from('missions')
            .select(`
              theme_id,
              themes:theme_id (
                name
              )
            `)
            .eq('id', missionId)
            .single();

          setCurrentPrompt({
            text: missionData.description,
            theme_id: missionWithTheme?.theme_id || '',
            theme_name: missionWithTheme?.themes?.name || 'No theme',
            type: 'mission',
            title: missionData.title
          });
        } else {
          console.log('🎯 MISSION MODE: No mission data in state, fetching from database...');
          // Fetch mission data with theme (fallback)
          const { data: missionData, error: missionError } = await supabase
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

          if (missionError) {
            console.error('❌ MISSION ERROR: Failed to fetch mission data:', missionError);
          }

          if (missionData) {
            console.log('✅ MISSION SUCCESS: Mission data fetched:', missionData);
            setCurrentPrompt({
              text: missionData.description,
              theme_id: missionData.theme_id || '',
              theme_name: missionData.themes?.name || 'No theme',
              type: 'mission',
              title: missionData.title
            });
          } else {
            console.log('❌ MISSION FAILED: No mission data found for ID:', missionId);
            console.log('❌ MISSION FAILED: This will cause fallback to daily prompt mode!');
          }
        }
      } else {
        console.log('📅 DAILY PROMPT MODE: No missionId, fetching daily prompt...');
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
          console.log('📅 DAILY PROMPT: Found daily prompt:', promptData);
          setCurrentPrompt({
            text: promptData.prompt_text,
            theme_id: promptData.theme_id,
            theme_name: promptData.themes?.name || 'No theme',
            type: 'daily',
            id: promptData.id
          });
        } else {
          console.log('📅 DAILY PROMPT: No daily prompt found for today');
        }
      }
    };
    
    fetchContent();
  }, [missionId]);

  // Set user's profile location when component mounts or user location changes
  useEffect(() => {
    console.log('VideoCreate: userLocation:', userLocation);
    console.log('VideoCreate: current location state:', routerLocation);
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
    // This function is now deprecated - missions use direct StoryCamera integration
    // Fall back to file upload for any remaining usage
    document.getElementById('video-file-input')?.click();
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
      
      // Compress in background if needed (don't block UI)
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        setIsCompressing(true);
        
        // Compress in background without blocking
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
            duration: 2000,
          });
        }).catch((compressionError) => {
          console.error('Compression failed:', compressionError);
          setIsCompressing(false);
          // Continue with original file
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

    // Start background processing
    setIsUploading(true);
    setUploadProgress(0);
    
    // Show initial toast
    toast({
      title: "Starting upload...",
      description: "Your video is being processed and uploaded in the background.",
      duration: 3000,
    });

    // Process in background
    processVideoInBackground().catch((error) => {
      console.error('Background processing failed:', error);
      setIsUploading(false);
      setUploadProgress(0);
      toast({
        title: "Upload failed",
        description: "Please try again later",
        variant: "destructive",
        duration: 5000,
      });
    });
  };

  const processVideoInBackground = async () => {
    try {
      console.log('Starting background video processing...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        console.log('Please log in to upload videos');
        return;
      }

      console.log('User authenticated:', user.id);

      setUploadProgress(10);
      
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
        setUploadProgress(30);
      } catch (error) {
        console.error('Thumbnail generation failed:', error);
        console.error('Error message:', error?.message || 'No message');
        console.error('Error string:', JSON.stringify(error, null, 2));
        // Continue without thumbnail
      }

      setUploadProgress(50);
      
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
        
        throw new Error(uploadError?.message || "Unknown upload error");
      }

      console.log('Upload successful:', uploadData);
      setUploadProgress(80);

      // Get public URL for the uploaded video
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      console.log('Public URL generated:', publicUrl);

      // Get current prompt ID if responding to daily prompt
      let promptId = null;
      let missionIdForVideo = null;
      
      // Use missionId from URL params to determine if this is a mission video
      if (missionId) {
        missionIdForVideo = missionId;
        console.log('🎯 MISSION VIDEO: Using mission ID for video:', missionIdForVideo);
        console.log('🎯 MISSION VIDEO: URL contains missionId, this is a mission video');
      } else if (currentPrompt && currentPrompt.type === 'daily') {
        promptId = currentPrompt.id;
        console.log('📅 DAILY PROMPT: Using stored daily prompt ID for video:', promptId);
      } else {
        console.log('❓ UNKNOWN: No missionId in URL and no daily prompt type detected');
        console.log('❓ UNKNOWN: currentPrompt:', currentPrompt);
        console.log('❓ UNKNOWN: missionId from URL:', missionId);
      }

      // Create video record with storage URL
      console.log('🎬 FINAL VIDEO DATA:', {
        user_id: user.id,
        video_url: publicUrl,
        thumbnail_url: thumbnailUrl,
        title: caption || (missionIdForVideo ? 'Mission Response' : 'Daily Prompt Response'),
        description: caption,
        location: location || null,
        daily_prompt_id: promptId,
        mission_id: missionIdForVideo,
        is_public: true,
        is_hidden: false,
        moderation_status: 'approved'
      });
      console.log('🔍 DEBUG INFO:');
      console.log('  - Current prompt state:', currentPrompt);
      console.log('  - missionId from URL:', missionId);
      console.log('  - missionIdForVideo (final):', missionIdForVideo);
      console.log('  - promptId (final):', promptId);
      
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          video_url: publicUrl,
          thumbnail_url: thumbnailUrl,
          title: caption || (missionIdForVideo ? 'Mission Response' : 'Daily Prompt Response'),
          description: caption,
          location: location || null,
          daily_prompt_id: promptId,
          mission_id: missionIdForVideo,
          is_public: true,
          is_hidden: false,
          moderation_status: 'approved' // Content passed basic filtering
        })
        .select()
        .single();

      if (videoError) {
        console.error('Database error:', videoError);
        console.log(`Database error: ${videoError.message}`);
        return;
      }

      console.log('Video record created:', videoData);
      console.log('VideoCreate: Video visibility settings:', {
        id: videoData.id,
        is_public: videoData.is_public,
        is_hidden: videoData.is_hidden,
        moderation_status: videoData.moderation_status,
        mission_id: videoData.mission_id,
        daily_prompt_id: videoData.daily_prompt_id
      });

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

      setUploadProgress(100);
      console.log('Video submission complete!');
      
      
      // Show success toast
      toast({
        title: "Video uploaded successfully! 🎉",
        description: "Your video has been saved and will appear in the feed.",
        duration: 4000,
      });
      
      // Reset upload state
      setIsUploading(false);
      setUploadProgress(0);
      
      // Clear state and navigate home
      clearVideoState();
      navigate('/');
    } catch (error) {
      console.error('Error in background video processing:', error);
      setIsUploading(false);
      setUploadProgress(0);
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred during upload",
        variant: "destructive",
        duration: 5000,
      });
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
      // Navigate back to the appropriate page based on the route
      const currentPath = window.location.pathname;
      if (currentPath.includes('/create/mission/')) {
        navigate('/missions');
      } else if (currentPath.includes('/create/daily-prompt')) {
        navigate('/');
      } else {
        // Default fallback to home
        navigate('/');
      }
    } else if (step === 'edit') {
      setStep('record');
    }
  };

  return (
    <div className="min-h-screen-safe bg-background font-quicksand">
      {/* Header */}
      <header className="sticky-header">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="p-2 text-velyar-earth hover:bg-velyar-soft"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-medium text-velyar-earth font-nunito">{t("videoCreate.shareYourStory")}</h1>
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
                  ⏱️ {t("videoCreate.maximumDuration", { seconds: MAX_RECORDING_TIME })} | 📁 {t("videoCreate.videosCompressed", { size: MAX_FILE_SIZE_MB })}
                </p>
                <div className="space-y-4">
                  <Button
                    onClick={startNativeRecording}
                    className="w-full bg-velyar-warm hover:bg-velyar-glow text-velyar-earth font-nunito font-medium"
                  >
                    <Video className="w-5 h-5 mr-2" />
                    {t("videoCreate.recordVideo")}
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
                        {isCompressing ? t("videoCreate.processing") : t("videoCreate.orUploadVideo")}
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
                  <Label htmlFor="caption" className="text-velyar-earth font-nunito">{t("videoCreate.caption")}</Label>
                  <Textarea
                    id="caption"
                    placeholder={t("videoCreate.tellUsAboutStory")}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="mt-2 border-velyar-earth/20 focus:border-velyar-earth"
                  />
                </div>
                <div>
                  <Label htmlFor="location" className="text-velyar-earth font-nunito">{t("videoCreate.location")}</Label>
                  <Input
                    id="location"
                    placeholder={t("videoCreate.cityCountry")}
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

            {isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-velyar-earth h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            <Button 
              onClick={handleSubmit}
              disabled={!videoFile || !caption.trim() || !location.trim() || isUploading}
              className="w-full bg-velyar-earth hover:bg-velyar-warm text-white font-nunito font-medium disabled:opacity-50"
            >
              {isUploading ? `${t("videoCreate.uploading")} ${uploadProgress}%` : t("videoCreate.share")}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default VideoCreate;
