import { useState, useEffect } from "react";
import { Trash2, Eye, AlertTriangle, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Video {
  id: string;
  user_id: string;
  title?: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  location?: string;
  duration?: number;
  is_public: boolean;
  created_at: string;
  profiles?: {
    username?: string;
    display_name?: string;
    email?: string;
  };
}

const AdminVideos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    filterVideos();
  }, [searchTerm, filterType, videos]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      
      // Fetch all videos with profile information
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (videosError) throw videosError;

      // Fetch profile data for each video
      const videosWithProfiles = [];
      if (videosData) {
        for (const video of videosData) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('user_id', video.user_id)
            .single();
          
          videosWithProfiles.push({
            ...video,
            profiles: profileData
          });
        }
      }

      setVideos(videosWithProfiles);
      setFilteredVideos(videosWithProfiles);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Error",
        description: "Failed to fetch videos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterVideos = () => {
    let filtered = videos;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(video => 
        video.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== "all") {
      if (filterType === "public") {
        filtered = filtered.filter(video => video.is_public);
      } else if (filterType === "private") {
        filtered = filtered.filter(video => !video.is_public);
      }
    }

    setFilteredVideos(filtered);
  };

  const extractStoragePath = (url: string): string | null => {
    try {
      // Extract the storage path from the full URL
      // URL format: https://{project}.supabase.co/storage/v1/object/public/videos/{path}
      const match = url.match(/\/videos\/(.+)$/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Error extracting storage path:', error);
      return null;
    }
  };

  const handleDeleteVideo = async (video: Video) => {
    setVideoToDelete(video);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteVideo = async () => {
    if (!videoToDelete) return;

    setDeleting(true);
    try {
      console.log('=== Starting video deletion ===');
      console.log('Video ID:', videoToDelete.id);
      console.log('Video URL:', videoToDelete.video_url);

      // Get current user to verify admin status
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user email:', user?.email);

      if (!user || user.email !== 'sumit@velyar.com') {
        throw new Error('Only sumit@velyar.com can delete videos');
      }

      // Step 1: Delete the database record first (this will cascade to related tables)
      console.log('Step 1: Deleting database record...');
      const { error: dbError } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoToDelete.id);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        console.error('Error code:', dbError.code);
        console.error('Error message:', dbError.message);
        console.error('Error details:', dbError.details);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log('✓ Database record deleted successfully');

      // Step 2: Delete the video file from storage
      const videoPath = extractStoragePath(videoToDelete.video_url);
      if (videoPath) {
        console.log('Step 2: Deleting video file from storage:', videoPath);
        const { error: storageError } = await supabase.storage
          .from('videos')
          .remove([videoPath]);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
          console.error('Storage error code:', storageError.message);
          // Continue anyway - the file might not exist
          console.log('! Video file deletion failed (continuing anyway)');
        } else {
          console.log('✓ Video file deleted successfully');
        }
      } else {
        console.log('! No video path found, skipping video file deletion');
      }

      // Step 3: Delete the thumbnail file from storage if it exists
      if (videoToDelete.thumbnail_url) {
        const thumbnailPath = extractStoragePath(videoToDelete.thumbnail_url);
        if (thumbnailPath) {
          console.log('Step 3: Deleting thumbnail from storage:', thumbnailPath);
          const { error: thumbnailError } = await supabase.storage
            .from('videos')
            .remove([thumbnailPath]);

          if (thumbnailError) {
            console.error('Thumbnail deletion error:', thumbnailError);
            // Continue anyway
            console.log('! Thumbnail deletion failed (continuing anyway)');
          } else {
            console.log('✓ Thumbnail deleted successfully');
          }
        }
      } else {
        console.log('! No thumbnail, skipping thumbnail deletion');
      }

      console.log('=== Video deletion completed successfully ===');

      toast({
        title: "Success",
        description: "Video deleted successfully",
      });

      // Refresh the video list immediately
      await fetchVideos();
    } catch (error: any) {
      console.error('=== Video deletion failed ===');
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete video. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    }
  };

  const handleViewVideo = (video: Video) => {
    window.open(video.video_url, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center">Loading videos...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Video Moderation Admin</h1>
        
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by ID, title, username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Videos</SelectItem>
              <SelectItem value="public">Public Only</SelectItem>
              <SelectItem value="private">Private Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-gray-600">
          Showing {filteredVideos.length} of {videos.length} videos
        </div>
      </div>

      <div className="grid gap-4">
        {filteredVideos.map((video) => (
          <Card key={video.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-mono truncate">
                    {video.id}
                  </CardTitle>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge variant={video.is_public ? "default" : "secondary"}>
                      {video.is_public ? "Public" : "Private"}
                    </Badge>
                    {video.profiles?.username && (
                      <Badge variant="outline">
                        @{video.profiles.username}
                      </Badge>
                    )}
                    {video.location && (
                      <Badge variant="outline">
                        📍 {video.location}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewVideo(video)}
                    title="View video"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteVideo(video)}
                    title="Delete video"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2 text-sm">
                {video.title && (
                  <div>
                    <span className="font-medium">Title:</span> {video.title}
                  </div>
                )}
                {video.description && (
                  <div>
                    <span className="font-medium">Description:</span> {video.description}
                  </div>
                )}
                <div className="text-gray-500">
                  <span className="font-medium">Created:</span> {formatDate(video.created_at)}
                  {video.duration && (
                    <span className="ml-4">
                      <span className="font-medium">Duration:</span> {formatDuration(video.duration)}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 font-mono truncate">
                  Storage: {video.video_url}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredVideos.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No videos found matching your criteria
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Video Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The video file from storage</li>
                <li>The thumbnail image</li>
                <li>The database record</li>
                <li>All related comments and interactions</li>
              </ul>
              {videoToDelete && (
                <div className="mt-4 p-3 bg-gray-100 rounded text-sm font-mono">
                  <div><strong>ID:</strong> {videoToDelete.id}</div>
                  {videoToDelete.title && (
                    <div><strong>Title:</strong> {videoToDelete.title}</div>
                  )}
                  {videoToDelete.profiles?.username && (
                    <div><strong>User:</strong> @{videoToDelete.profiles.username}</div>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteVideo}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminVideos;

