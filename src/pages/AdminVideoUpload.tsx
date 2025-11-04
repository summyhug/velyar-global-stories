import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateVideoThumbnail, uploadThumbnailToStorage } from "@/utils/videoThumbnail";
import { compressVideo, getVideoInfo } from "@/utils/videoCompression";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminVideoUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [missionId, setMissionId] = useState<string>("");
  const [dailyPromptId, setDailyPromptId] = useState<string>("");
  const [missions, setMissions] = useState<any[]>([]);
  const [dailyPrompts, setDailyPrompts] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    // Fetch missions
    supabase
      .from('missions')
      .select('id, title')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching missions:', error);
        } else {
          setMissions(data || []);
        }
      });

    // Fetch daily prompts
    supabase
      .from('daily_prompts')
      .select('id, prompt_text, date')
      .eq('is_active', true)
      .order('date', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching daily prompts:', error);
        } else {
          setDailyPrompts(data || []);
        }
      });
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const videoInfo = await getVideoInfo(file);
      
      if (videoInfo.duration > 30) {
        toast({
          title: "Video too long",
          description: `Please select a video under 30 seconds. Current: ${Math.round(videoInfo.duration)}s`,
          variant: "destructive",
        });
        return;
      }

      setVideoFile(file);
      
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
      
      // ALWAYS compress large files before upload to save Supabase storage
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 10) {
        setIsCompressing(true);
        try {
          const compressed = await compressVideo(file, {
            maxSizeMB: 10,
            maxWidthOrHeight: 1920,
          });
          
          // Only use compressed file if compression succeeded
          setVideoFile(compressed);
          
          // Update preview with compressed version
          URL.revokeObjectURL(previewUrl);
          const compressedUrl = URL.createObjectURL(compressed);
          setVideoPreview(compressedUrl);
          
          setIsCompressing(false);
          toast({
            title: "Video compressed",
            description: `Size reduced from ${fileSizeMB.toFixed(1)}MB to ${(compressed.size / (1024 * 1024)).toFixed(1)}MB. Ready to upload!`,
            duration: 5000,
          });
        } catch (compressionError: any) {
          console.error('Compression failed:', compressionError);
          setIsCompressing(false);
          
          // For very large files, don't allow upload without compression
          if (fileSizeMB > 100) {
            setVideoFile(null);
            setVideoPreview(null);
            URL.revokeObjectURL(previewUrl);
            toast({
              title: "Compression required",
              description: compressionError?.message || `File is too large (${fileSizeMB.toFixed(1)}MB). Compression failed. Please use a smaller file or compress it manually.`,
              variant: "destructive",
              duration: 10000,
            });
          } else {
            // For smaller files, allow upload but warn
            toast({
              title: "Compression failed",
              description: compressionError?.message || "Compression failed. Uploading original file may fail due to size limits.",
              variant: "destructive",
              duration: 8000,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error processing video:', error);
      toast({
        title: "Error",
        description: "Failed to process video",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (!videoFile || !user) {
      toast({
        title: "Missing information",
        description: "Please select a video and ensure you're logged in",
        variant: "destructive",
      });
      return;
    }

    if (!missionId && !dailyPromptId) {
      toast({
        title: "Missing association",
        description: "Please select either a Mission or Daily Prompt",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Generate thumbnail
      setUploadProgress(10);
      let thumbnailUrl = null;
      try {
        const thumbnail = await generateVideoThumbnail(videoFile, 2);
        thumbnailUrl = await uploadThumbnailToStorage(thumbnail, `${user.id}_${Date.now()}`);
        setUploadProgress(30);
      } catch (error) {
        console.error('Thumbnail generation failed:', error);
        // Continue without thumbnail
      }

      // Upload video
      setUploadProgress(50);
      const fileName = `${user.id}/${Date.now()}.${videoFile.name.split('.').pop() || 'mp4'}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, videoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      setUploadProgress(80);

      // Create video record
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          video_url: publicUrl,
          thumbnail_url: thumbnailUrl,
          title: caption || (missionId ? 'Mission Response' : 'Daily Prompt Response'),
          description: caption,
          location: location || null,
          daily_prompt_id: dailyPromptId || null,
          mission_id: missionId || null,
          is_public: true,
          is_hidden: false,
          moderation_status: 'approved'
        })
        .select()
        .single();

      if (videoError) throw videoError;

      setUploadProgress(100);
      
      toast({
        title: "Success!",
        description: "Video uploaded successfully",
      });

      // Reset form
      setVideoFile(null);
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
      setVideoPreview(null);
      setCaption("");
      setLocation("");
      setMissionId("");
      setDailyPromptId("");
      setIsUploading(false);
      setUploadProgress(0);

      // Reset file input
      const fileInput = document.getElementById('video-file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-background font-quicksand">
      {/* Header */}
      <header className="sticky-header">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="p-2 text-velyar-earth hover:bg-velyar-soft"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-medium text-velyar-earth font-nunito">Admin Video Upload</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <Card className="border-velyar-earth/10">
          <CardHeader>
            <CardTitle className="font-nunito">Upload Video</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Upload videos for the current user account
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="video-file">Video File</Label>
              <Input
                id="video-file"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                disabled={isUploading || isCompressing}
                className="mt-2"
              />
              {isCompressing && (
                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Compressing video... Please wait
                </p>
              )}
              {videoFile && !isCompressing && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)}MB)
                </p>
              )}
            </div>

            {videoPreview && (
              <div>
                <Label>Preview</Label>
                <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden mt-2 max-w-xs">
                  <video 
                    src={videoPreview} 
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                    muted
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Describe your video..."
                className="mt-2"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="location">Location (City, Country)</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., New York, USA"
                className="mt-2"
              />
            </div>

            <div>
              <Label>Associate with:</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="mission" className="text-sm text-muted-foreground">Mission (optional)</Label>
                  <Select value={missionId} onValueChange={(value) => {
                    setMissionId(value);
                    setDailyPromptId(""); // Clear daily prompt if mission selected
                  }}>
                    <SelectTrigger id="mission" className="mt-1">
                      <SelectValue placeholder="Select mission" />
                    </SelectTrigger>
                    <SelectContent>
                      {missions.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No missions available</div>
                      ) : (
                        missions.map((mission) => (
                          <SelectItem key={mission.id} value={mission.id}>
                            {mission.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="daily-prompt" className="text-sm text-muted-foreground">Daily Prompt (optional)</Label>
                  <Select value={dailyPromptId} onValueChange={(value) => {
                    setDailyPromptId(value);
                    setMissionId(""); // Clear mission if daily prompt selected
                  }}>
                    <SelectTrigger id="daily-prompt" className="mt-1">
                      <SelectValue placeholder="Select prompt" />
                    </SelectTrigger>
                    <SelectContent>
                      {dailyPrompts.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No prompts available</div>
                      ) : (
                        dailyPrompts.map((prompt) => (
                          <SelectItem key={prompt.id} value={prompt.id}>
                            {new Date(prompt.date).toLocaleDateString()} - {prompt.prompt_text.substring(0, 40)}...
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Select either a Mission or Daily Prompt (not both)
              </p>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-velyar-earth h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!videoFile || isUploading || isCompressing || (!missionId && !dailyPromptId)}
              className="w-full bg-velyar-earth hover:bg-velyar-warm text-white font-nunito font-medium disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminVideoUpload;

