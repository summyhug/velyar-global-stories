-- Create global_prompts table for configurable banner messages
CREATE TABLE public.global_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  target_regions JSONB,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_prompts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Global prompts are viewable by everyone" 
ON public.global_prompts 
FOR SELECT 
USING (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));

-- Add trigger for timestamps
CREATE TRIGGER update_global_prompts_updated_at
BEFORE UPDATE ON public.global_prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert a default prompt that can be customized
INSERT INTO public.global_prompts (message_text, priority) 
VALUES ('Help us achieve global balance! We need more voices from underrepresented regions to tell their stories.', 1);