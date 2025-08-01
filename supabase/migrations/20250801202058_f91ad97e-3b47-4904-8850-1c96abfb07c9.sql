-- Add language field to videos table
ALTER TABLE public.videos 
ADD COLUMN language TEXT DEFAULT 'en';

-- Add index for better performance on language queries
CREATE INDEX idx_videos_language ON public.videos(language);

-- Add index for better performance on date-based queries for this week
CREATE INDEX idx_videos_created_at ON public.videos(created_at);