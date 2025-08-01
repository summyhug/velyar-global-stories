-- Add theme_id column to daily_prompts table
ALTER TABLE public.daily_prompts 
ADD COLUMN theme_id UUID REFERENCES public.themes(id);

-- Update existing daily prompts with appropriate themes
-- Let's assign the current "what sound defines your neighborhood?" to nature theme
UPDATE public.daily_prompts 
SET theme_id = (SELECT id FROM public.themes WHERE name = 'nature' LIMIT 1)
WHERE prompt_text ILIKE '%sound%neighborhood%';

-- Create some sample themed daily prompts for testing
INSERT INTO public.daily_prompts (prompt_text, date, is_active, theme_id)
VALUES 
  ('what did you eat for breakfast today?', CURRENT_DATE + INTERVAL '1 day', false, (SELECT id FROM public.themes WHERE name = 'food' LIMIT 1)),
  ('how does your family celebrate special occasions?', CURRENT_DATE + INTERVAL '2 days', false, (SELECT id FROM public.themes WHERE name = 'family' LIMIT 1)),
  ('what''s your favorite place in nature?', CURRENT_DATE + INTERVAL '3 days', false, (SELECT id FROM public.themes WHERE name = 'nature' LIMIT 1));