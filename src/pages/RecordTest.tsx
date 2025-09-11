import React, { useMemo, useState } from "react";
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

interface LocationState {
  filePath?: string;
  contentUri?: string;
  promptId?: string | null;
}

const VideoPreviewShare: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;
  const query = new URLSearchParams(location.search);
  const qpFile = query.get('filePath') || undefined;
  const qpContent = query.get('contentUri') || undefined;
  const qpPrompt = query.get('promptId') || undefined;
  const stored = (() => { try { return sessionStorage.getItem('lastStoryVideoPath') || undefined; } catch { return undefined; } })();
  const filePath = state.filePath || qpFile || stored;
  const contentUri = state.contentUri || qpContent;
  const promptId = state.promptId || qpPrompt || null;

  const playableSrc = useMemo(() => {
    if (contentUri) return contentUri; // content URIs are directly playable
    if (!filePath) return "";
    // Convert native file path to a webview-playable URL
    return Capacitor.convertFileSrc(filePath);
  }, [filePath, contentUri]);

  const [desc, setDesc] = useState("");
  const remaining = Math.max(0, 150 - desc.length);

  const handleShare = async () => {
    try {
      if (!filePath) throw new Error('No video filePath');

      alert('🔍 Share start: preparing to read file');
      console.log('[Share] filePath:', filePath, '| promptId:', promptId);

      // Ensure we have a promptId; if missing, derive today's or most recent active
      let effectivePromptId: string | null = promptId;
      if (!effectivePromptId) {
        alert('ℹ️ No promptId provided. Attempting to resolve current prompt...');
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
          alert('✅ Resolved promptId: ' + (effectivePromptId || 'none'));
        } catch (e) {
          console.warn('[Share] Failed to resolve prompt id:', e);
          alert('⚠️ Could not resolve promptId automatically.');
        }
      }

      // Load file via fetch of convertFileSrc
      const src = Cap.convertFileSrc(filePath);
      alert('🔍 Converted file src: ' + src);
      const res = await fetch(src);
      const blob = await res.blob();
      const originalFile = new File([blob], 'story.mp4', { type: blob.type || 'video/mp4' });
      alert(`📦 Original file loaded: size=${originalFile.size} type=${originalFile.type}`);

      // Compress
      let compressed: File;
      try {
        alert('🔧 Starting compression...');
        compressed = await compressVideo(originalFile, { maxSizeMB: 50, maxWidthOrHeight: 1280 });
        alert(`✅ Compression complete: size=${compressed.size} type=${compressed.type}`);
      } catch (e) {
        // Fallback to original if compression fails
        console.warn('[Share] Compression failed, using original file. Error:', e);
        alert('⚠️ Compression failed, using original file.');
        compressed = originalFile;
      }

      // Thumbnail
      alert('🖼️ Generating thumbnail...');
      const thumbBase64 = await generateVideoThumbnail(compressed, 1.5);
      alert(`🖼️ Thumbnail generated (length=${thumbBase64.length}) - uploading...`);
      const thumbUrl = await uploadThumbnailToStorage(thumbBase64, 'thumb');
      alert('✅ Thumbnail uploaded: ' + thumbUrl);

      // Upload video to supabase storage
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      alert('👤 User authenticated: ' + user.id);

      // Fetch profile location/country
      let locationStr: string | null = null;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('city, country')
          .eq('user_id', user.id)
          .maybeSingle();
        if (profile?.city && profile?.country) locationStr = `${profile.city}, ${profile.country}`;
        else if (profile?.country) locationStr = profile.country;
        // Fallback to auth metadata country if profile missing
        if (!locationStr && (user as any)?.user_metadata?.country) {
          locationStr = (user as any).user_metadata.country;
        }
        alert('🌍 Location resolved: ' + (locationStr || 'none'));
      } catch (e) {
        console.warn('[Share] Failed fetching profile location:', e);
      }

      const videoPath = `${user.id}/videos/${Date.now()}_${compressed.name}`;
      alert('⬆️ Uploading video to storage path: ' + videoPath);
      const { data: up, error: upErr } = await supabase.storage
        .from('videos')
        .upload(videoPath, compressed, { contentType: compressed.type || 'video/mp4', upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('videos').getPublicUrl(up.path);
      const publicVideoUrl = urlData.publicUrl;
      alert('✅ Video uploaded. Public URL: ' + publicVideoUrl);

      // Insert DB row into videos table
      alert('🗄️ Inserting DB row...');
      const { error: insErr } = await supabase.from('videos').insert({
        user_id: user.id,
        description: desc,
        video_url: publicVideoUrl,
        thumbnail_url: thumbUrl,
        daily_prompt_id: effectivePromptId || null,
        location: locationStr,
        is_public: true,
        is_hidden: false
      });
      if (insErr) throw insErr;
      alert('✅ DB insert complete');

      // Navigate to the list page for the prompt if available
      if (effectivePromptId) {
        navigate(`/video-list/daily-prompt/${effectivePromptId}`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (e) {
      console.error('[Share] Failed:', e);
      alert('❌ Share failed: ' + ((e as any)?.message || String(e)));
    }
  };

  const header = (
    <div className="pt-safe-header px-4">
      <div className="max-w-md mx-auto py-3 flex items-center justify-between">
        <button
          aria-label="Close"
          className="p-2 rounded-full hover:bg-muted transition"
          onClick={() => navigate("/", { replace: true })}
        >
          <X className="w-5 h-5 text-foreground dark:text-white" />
        </button>
        <h1 className="text-lg font-display text-foreground">Preview & Share</h1>
        <div className="w-9" />
      </div>
    </div>
  );

  return (
    <PageLayout header={header} showBottomNav={false}>
      <div className="px-4 pb-safe-bottom">
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

          {/* Description input */}
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

          {/* Primary actions */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              variant="outline"
              className="w-full bg-card/60 hover:bg-card text-foreground border-border"
              onClick={() => navigate(-1)}
            >
              Re-record
            </Button>
            <Button
              className="w-full btn-primary-enhanced"
              onClick={handleShare}
            >
              Share
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default VideoPreviewShare;


