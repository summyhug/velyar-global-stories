-- Add theme support to missions
ALTER TABLE public.missions 
ADD COLUMN theme_id UUID REFERENCES public.themes(id);