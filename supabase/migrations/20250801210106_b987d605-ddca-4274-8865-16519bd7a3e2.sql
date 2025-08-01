-- Create themes table
CREATE TABLE public.themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create video_themes junction table
CREATE TABLE public.video_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(video_id, theme_id)
);

-- Create archived_prompts table
CREATE TABLE public.archived_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_text TEXT NOT NULL,
  archive_date DATE NOT NULL,
  response_count INTEGER NOT NULL DEFAULT 0,
  country_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_prompts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for themes
CREATE POLICY "Themes are viewable by everyone" 
ON public.themes 
FOR SELECT 
USING (is_active = true);

-- Create RLS policies for video_themes
CREATE POLICY "Video themes are viewable by everyone" 
ON public.video_themes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM videos 
  WHERE videos.id = video_themes.video_id 
  AND videos.is_public = true
));

CREATE POLICY "Users can manage themes on their own videos" 
ON public.video_themes 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM videos 
  WHERE videos.id = video_themes.video_id 
  AND videos.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM videos 
  WHERE videos.id = video_themes.video_id 
  AND videos.user_id = auth.uid()
));

-- Create RLS policies for archived_prompts
CREATE POLICY "Archived prompts are viewable by everyone" 
ON public.archived_prompts 
FOR SELECT 
USING (true);

-- Insert starter themes
INSERT INTO public.themes (name, icon, description) VALUES
('food', '🍽️', 'Share your culinary experiences from around the world'),
('celebrations', '🎉', 'Capture moments of joy and celebration'),
('nature', '🌿', 'Show the beauty of the natural world'),
('work', '💼', 'Document daily work life and professional experiences'),
('family', '👨‍👩‍👧‍👦', 'Share precious family moments and traditions'),
('travel', '✈️', 'Explore new places and share your adventures');

-- Insert sample archived prompts
INSERT INTO public.archived_prompts (prompt_text, archive_date, response_count, country_count) VALUES
('what''s your favorite sound?', '2024-03-15', 2847, 94),
('show us your morning view', '2024-03-14', 3241, 87),
('what makes you smile?', '2024-03-13', 2156, 92),
('describe your hometown in 30 seconds', '2024-03-12', 1987, 76),
('what''s the most beautiful thing you saw today?', '2024-03-11', 2543, 89),
('share a family tradition', '2024-03-10', 1876, 68);

-- Add updated_at trigger for themes
CREATE TRIGGER update_themes_updated_at
BEFORE UPDATE ON public.themes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for archived_prompts
CREATE TRIGGER update_archived_prompts_updated_at
BEFORE UPDATE ON public.archived_prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_video_themes_video_id ON public.video_themes(video_id);
CREATE INDEX idx_video_themes_theme_id ON public.video_themes(theme_id);
CREATE INDEX idx_archived_prompts_archive_date ON public.archived_prompts(archive_date DESC);