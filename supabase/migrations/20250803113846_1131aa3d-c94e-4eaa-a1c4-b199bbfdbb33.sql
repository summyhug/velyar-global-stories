-- Create video_likes table for tracking likes/octos
CREATE TABLE public.video_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Enable Row Level Security
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for video_likes
CREATE POLICY "Users can view all likes" 
ON public.video_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can like videos" 
ON public.video_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike videos" 
ON public.video_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add some helpful indexes
CREATE INDEX idx_video_likes_video_id ON public.video_likes(video_id);
CREATE INDEX idx_video_likes_user_id ON public.video_likes(user_id);