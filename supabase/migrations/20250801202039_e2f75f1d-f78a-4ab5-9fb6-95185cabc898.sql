-- Add language field to videos table
ALTER TABLE public.videos 
ADD COLUMN language TEXT DEFAULT 'en';

-- Add index for better performance on language queries
CREATE INDEX idx_videos_language ON public.videos(language);

-- Add index for better performance on date-based queries
CREATE INDEX idx_videos_created_at_week ON public.videos(created_at) WHERE created_at >= (CURRENT_DATE - INTERVAL '7 days');