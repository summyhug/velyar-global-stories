-- Create table to cache geographic analysis results
CREATE TABLE public.geographic_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_videos INTEGER NOT NULL DEFAULT 0,
  total_countries INTEGER NOT NULL DEFAULT 0,
  country_distribution JSONB NOT NULL DEFAULT '{}',
  underrepresented_regions JSONB NOT NULL DEFAULT '[]',
  diversity_score NUMERIC(3,2) NOT NULL DEFAULT 0,
  recommended_targets JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.geographic_analysis ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (cached data should be public)
CREATE POLICY "Geographic analysis is viewable by everyone" 
ON public.geographic_analysis 
FOR SELECT 
USING (true);

-- Add target_regions field to missions table for dynamic targeting
ALTER TABLE public.missions 
ADD COLUMN target_regions JSONB DEFAULT NULL;

-- Create index for faster queries
CREATE INDEX idx_geographic_analysis_date ON public.geographic_analysis (analysis_date DESC);
CREATE INDEX idx_missions_target_regions ON public.missions USING GIN(target_regions);

-- Add trigger for updated_at
CREATE TRIGGER update_geographic_analysis_updated_at
BEFORE UPDATE ON public.geographic_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();