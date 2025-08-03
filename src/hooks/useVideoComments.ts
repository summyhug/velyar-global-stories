import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
  };
}

interface VideoLike {
  id: string;
  user_id: string;
}

export const useVideoComments = (videoId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<VideoLike[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [videoId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch comments
      const { data: commentsData } = await supabase
        .from('video_comments')
        .select(`
          id,
          content,
          user_id,
          created_at,
          profiles:user_id (
            username,
            display_name
          )
        `)
        .eq('video_id', videoId)
        .order('created_at', { ascending: true });

      // Fetch likes
      const { data: likesData } = await supabase
        .from('video_likes')
        .select('id, user_id')
        .eq('video_id', videoId);

      // Check if current user liked this video
      const { data: { user } } = await supabase.auth.getUser();
      const userLiked = user && likesData?.some(like => like.user_id === user.id);

      setComments(commentsData || []);
      setLikes(likesData || []);
      setIsLiked(!!userLiked);
    } catch (error) {
      console.error('Error fetching video data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('video_comments')
      .insert({
        video_id: videoId,
        user_id: user.id,
        content: content.trim()
      });

    if (!error) {
      fetchData();
      return true;
    }
    return false;
  };

  const toggleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isLiked) {
      // Remove like
      const { error } = await supabase
        .from('video_likes')
        .delete()
        .eq('video_id', videoId)
        .eq('user_id', user.id);
      
      if (!error) {
        setIsLiked(false);
        setLikes(prev => prev.filter(like => like.user_id !== user.id));
      }
    } else {
      // Add like
      const { error } = await supabase
        .from('video_likes')
        .insert({
          video_id: videoId,
          user_id: user.id
        });
      
      if (!error) {
        setIsLiked(true);
        setLikes(prev => [...prev, { id: '', user_id: user.id }]);
      }
    }
  };

  return {
    comments,
    likes,
    isLiked,
    loading,
    addComment,
    toggleLike,
    likesCount: likes.length
  };
};