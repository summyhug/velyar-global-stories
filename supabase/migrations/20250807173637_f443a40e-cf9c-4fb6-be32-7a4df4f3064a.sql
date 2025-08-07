-- Add RLS policies for mission management
CREATE POLICY "Users can create missions" 
ON public.missions 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update missions" 
ON public.missions 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete missions" 
ON public.missions 
FOR DELETE 
USING (auth.uid() IS NOT NULL);