import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";
import { Textarea } from "@/components/ui/textarea";
import { PageLayout } from "@/components/PageLayout";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { compressVideo } from "@/utils/videoCompression";
import { generateVideoThumbnail, uploadThumbnailToStorage } from "@/utils/videoThumbnail";
import { Capacitor as Cap } from "@capacitor/core";
import StoryCamera from "../../StoryCamera";

interface LocationState {
  filePath?: string;
  contentUri?: string;
  promptId?: string | null;
  missionId?: string | null;
  contextType?: 'mission' | 'daily' | null;
}

const VideoPreviewShare: React.FC = () => {
  console.log('📹 ===== VideoPreview: Component rendering START =====');
  
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;
  const query = new URLSearchParams(location.search);
  const qpFile = query.get('filePath') || undefined;
  const qpContent = query.get('contentUri') || undefined;
  const qpPrompt = query.get('promptId') || undefined;
  const qpMission = query.get('missionId') || undefined;
  const qpContextType = query.get('contextType') || undefined;
  const stored = (() => { try { return sessionStorage.getItem('lastStoryVideoPath') || undefined; } catch { return undefined; } })();
  
  const filePath = state.filePath || qpFile || stored;
  const contentUri = state.contentUri || qpContent;
  
  const contextType = state.contextType || qpContextType;
  const promptId = state.promptId || qpPrompt;
  const missionId = state.missionId || qpMission;

  const playableSrc = useMemo(() => {
    if (contentUri) return contentUri;
    if (!filePath) return "";
    return Capacitor.convertFileSrc(filePath);
  }, [filePath, contentUri]);

  const [desc, setDesc] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [promptText, setPromptText] = useState<string>("Record your story");
  const remaining = Math.max(0, 150 - desc.length);

  useEffect(() => {
    console.log('📹 VideoPreview: Component mounted');
    console.log('📹 VideoPreview: filePath:', filePath);

    // Fetch prompt text based on context
    const fetchPromptText = async () => {
      try {
        if (contextType === 'daily' && promptId) {
          const { data, error } = await supabase
            .from('daily_prompts')
            .select('prompt_text')
            .eq('id', promptId)
            .maybeSingle();

          if (!error && data?.prompt_text) {
            setPromptText(data.prompt_text);
            console.log('📹 VideoPreview: Fetched daily prompt text:', data.prompt_text);
          }
        } else if (contextType === 'mission' && missionId) {
          const { data, error } = await supabase
            .from('missions')
            .select('description')
            .eq('id', missionId)
            .maybeSingle();

          if (!error && data?.description) {
            setPromptText(data.description);
            console.log('📹 VideoPreview: Fetched mission description:', data.description);
          }
        }
      } catch (error) {
        console.error('📹 VideoPreview: Error fetching prompt text:', error);
      }
    };

    fetchPromptText();
  }, [contextType, promptId, missionId]);

  const handleExit = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('📹 VideoPreview: handleExit called');

    // Clear video data to prevent infinite navigation loop
    try {
      console.log('📹 VideoPreview: Clearing video data');
      await StoryCamera.clearVideoData?.();
      console.log('📹 VideoPreview: Video data cleared');
    } catch (err) {
      console.warn('📹 VideoPreview: Failed to clear video data:', err);
    }

    // Navigate to home page explicitly (camera already auto-dismissed by plugin)
    console.log('📹 VideoPreview: Navigating to home');
    navigate('/', { replace: true });
  };

  const handleReRecord = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('📹 VideoPreview: handleReRecord called');

    // Clear video data to prevent infinite navigation loop
    try {
      console.log('📹 VideoPreview: Clearing video data for re-record');
      await StoryCamera.clearVideoData?.();
      console.log('📹 VideoPreview: Video data cleared');
    } catch (err) {
      console.warn('📹 VideoPreview: Failed to clear video data:', err);
    }

    // Immediately reopen camera with same context
    try {
      console.log('📹 VideoPreview: Starting re-record with context:', { contextType, promptId, missionId, promptText });

      const storyResult = await StoryCamera.recordVideo({
        duration: 30,
        camera: 'rear',
        allowOverlays: true,
        promptName: promptText,
        contextType: contextType as 'mission' | 'daily' | undefined,
        promptId: promptId || undefined,
        missionId: missionId || undefined
      });

      console.log('📹 VideoPreview: Re-record completed:', storyResult);

      // Extract filePath with retry logic (mirror DailyPrompt pattern)
      let fp: string | undefined = (storyResult as any)?.filePath;
      if (!fp) {
        try {
          const data = await (StoryCamera as any).getVideoData?.();
          if (data?.filePath) fp = data.filePath;
        } catch {}
      }

      if (!fp) {
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

        // Build target URL with context params
        let target = `/video-preview?filePath=${encodeURIComponent(fp)}`;
        if (contextType === 'mission' && missionId) {
          target += `&missionId=${encodeURIComponent(missionId)}&contextType=mission`;
        } else if (contextType === 'daily' && promptId) {
          target += `&promptId=${encodeURIComponent(promptId)}&contextType=daily`;
        }

        console.log('📹 VideoPreview: Navigating to preview with new video');
        setTimeout(() => {
          navigate(target, {
            replace: true,
            state: {
              filePath: fp,
              promptId: storyResult.promptId || promptId,
              missionId: storyResult.missionId || missionId,
              contextType: storyResult.contextType || contextType
            }
          });
        }, 0);
      } else {
        console.warn('VideoPreview: Could not determine filePath after re-recording');
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString?.() || 'Unknown error';
      console.error('📹 VideoPreview: Re-record failed:', errorMessage);
      // Stay on current page if re-record fails
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    setUploadProgress(0);
    setUploadStatus('Preparing video...');
    
    try {
      if (!filePath) throw new Error('No video filePath');

      let effectivePromptId: string | null = null;
      let effectiveMissionId: string | null = null;
      
      if (contextType === 'mission' && missionId) {
        effectiveMissionId = missionId;
      } else if (contextType === 'daily' && promptId) {
        effectivePromptId = promptId;
      } else if (missionId) {
        effectiveMissionId = missionId;
      } else if (promptId) {
        effectivePromptId = promptId;
      } else {
        try {
          const today = new Date().toISOString().split('T')[0];
          const { data: todayPrompt } = await supabase
            .from('daily_prompts')
            .select('id')
            .eq('date', today)
            .eq('is_active', true)
            .maybeSingle();
          if (todayPrompt?.id) {
            effectivePromptId = todayPrompt.id as string;
          } else {
            const { data: recentPrompt } = await supabase
              .from('daily_prompts')
              .select('id')
              .eq('is_active', true)
              .order('date', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (recentPrompt?.id) effectivePromptId = recentPrompt.id as string;
          }
          setUploadStatus('Resolved prompt context');
        } catch (e) {
          console.warn('[Share] Failed to resolve prompt id:', e);
          setUploadStatus('Using fallback prompt context');
        }
      }

      setUploadProgress(10);
      setUploadStatus('Loading video file...');
      const src = Cap.convertFileSrc(filePath);
      const res = await fetch(src);
      const blob = await res.blob();
      const originalFile = new File([blob], 'story.mp4', { type: blob.type || 'video/mp4' });

      setUploadProgress(20);

      // Skip browser-based compression on iOS - it can cause crashes
      // Videos from StoryCamera are already well-optimized
      let compressed: File;
      const isIOS = Capacitor.getPlatform() === 'ios';

      if (isIOS) {
        console.log('[Share] iOS detected - skipping browser compression (using native optimized video)');
        setUploadStatus('Preparing video...');
        compressed = originalFile;
      } else {
        setUploadStatus('Compressing video...');
        try {
          compressed = await compressVideo(originalFile, { maxSizeMB: 50, maxWidthOrHeight: 1280 });
        } catch (e) {
          console.warn('[Share] Compression failed, using original file. Error:', e);
          compressed = originalFile;
        }
      }

      setUploadProgress(40);
      setUploadStatus('Generating thumbnail...');
      const thumbBase64 = await generateVideoThumbnail(compressed, 1.5);
      setUploadStatus('Uploading thumbnail...');
      const thumbUrl = await uploadThumbnailToStorage(thumbBase64, 'thumb');

      setUploadProgress(50);
      setUploadStatus('Authenticating user...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let locationStr: string | null = null;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('city, country')
          .eq('user_id', user.id)
          .maybeSingle();
        if (profile?.city && profile?.country) locationStr = `${profile.city}, ${profile.country}`;
        else if (profile?.country) locationStr = profile.country;
        if (!locationStr && (user as any)?.user_metadata?.country) {
          locationStr = (user as any).user_metadata.country;
        }
        setUploadStatus('Location resolved');
      } catch (e) {
        console.warn('[Share] Failed fetching profile location:', e);
      }

      const videoPath = `${user.id}/videos/${Date.now()}_${compressed.name}`;
      setUploadProgress(70);
      setUploadStatus('Uploading video...');
      const { data: up, error: upErr } = await supabase.storage
        .from('videos')
        .upload(videoPath, compressed, { contentType: compressed.type || 'video/mp4', upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('videos').getPublicUrl(up.path);
      const publicVideoUrl = urlData.publicUrl;

      setUploadProgress(90);
      setUploadStatus('Saving video data...');
      const { error: insErr } = await supabase.from('videos').insert({
        user_id: user.id,
        description: desc,
        video_url: publicVideoUrl,
        thumbnail_url: thumbUrl,
        daily_prompt_id: effectivePromptId,
        mission_id: effectiveMissionId,
        location: locationStr,
        is_public: true,
        is_hidden: false
      });
      if (insErr) throw insErr;
      setUploadProgress(100);
      setUploadStatus('Complete!');

      // Clear video data after successful upload
      try {
        console.log('📹 VideoPreview: Clearing video data after successful share');
        await StoryCamera.clearVideoData?.();
        console.log('📹 VideoPreview: Video data cleared');
      } catch (err) {
        console.warn('📹 VideoPreview: Failed to clear video data:', err);
      }

      // Navigate after successful share (camera already auto-dismissed by plugin)
      if (effectiveMissionId) {
        navigate(`/video-list/mission/${effectiveMissionId}`, { replace: true });
      } else if (effectivePromptId) {
        navigate(`/video-list/daily-prompt/${effectivePromptId}`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (e) {
      console.error('[Share] Failed:', e);
      setUploadStatus('Upload failed: ' + ((e as any)?.message || String(e)));
    } finally {
      setIsSharing(false);
    }
  };

  const header = (
    <div className="px-4">
      <div className="max-w-md mx-auto py-3 flex items-center justify-between">
        <button
          aria-label="Close"
          className="p-2 rounded-full hover:bg-muted transition"
          onClick={(e) => handleExit(e)}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <X className="w-5 h-5 text-foreground dark:text-white" />
        </button>
        <h1 className="text-lg font-display text-foreground">Preview & Share</h1>
        <div className="w-9" />
      </div>
    </div>
  );

  console.log('📹 VideoPreview: About to return JSX');

  return (
    <PageLayout header={header} showBottomNav={false}>
      <div className="px-4">
        <div className="max-w-md mx-auto space-y-5">

          {(filePath || contentUri) && (
            <div className="space-y-3">
              {playableSrc ? (
                <video
                  src={playableSrc}
                  controls
                  className="w-full rounded-lg bg-black aspect-[9/16]"
                  playsInline
                />
              ) : (
                <div className="text-center text-sm text-red-500">
                  Could not convert path to a playable URL.
                </div>
              )}
            </div>
          )}

          <div className="space-y-1">
            <Textarea
              value={desc}
              onChange={(e) => {
                const v = e.target.value.slice(0, 150);
                setDesc(v);
              }}
              placeholder="Add a description (150 characters max)"
              className="w-full resize-none text-foreground dark:text-white"
              rows={3}
            />
            <div className="text-xs text-muted-foreground text-right">{remaining} left</div>
          </div>

          {isSharing && (
            <div className="space-y-3 pt-2">
              <div className="text-center">
                <div className="text-sm font-medium text-foreground mb-2">{uploadStatus}</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{uploadProgress}%</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              variant="outline"
              className="w-full bg-card/60 hover:bg-card text-foreground border-border"
              onClick={(e) => handleReRecord(e)}
              disabled={isSharing}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              Re-record
            </Button>
            <Button
              className="w-full btn-primary-enhanced"
              onClick={handleShare}
              disabled={isSharing}
            >
              {isSharing ? 'Sharing...' : 'Share'}
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default VideoPreviewShare;
