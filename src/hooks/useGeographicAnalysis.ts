import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GeographicAnalysis {
  id: string;
  analysis_date: string;
  total_videos: number;
  total_countries: number;
  country_distribution: any;
  underrepresented_regions: any;
  diversity_score: number;
  recommended_targets: any;
  created_at: string;
  updated_at: string;
}

export function useGeographicAnalysis() {
  const [analysis, setAnalysis] = useState<GeographicAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        // Get the most recent analysis
        const { data, error } = await supabase
          .from('geographic_analysis')
          .select('*')
          .order('analysis_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        setAnalysis(data);
      } catch (err) {
        console.error('Error fetching geographic analysis:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalysis();
  }, []);

  const triggerAnalysis = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('analyze-geography');
      
      if (error) throw error;
      
      // Refetch the analysis after triggering
      const { data: newAnalysis, error: fetchError } = await supabase
        .from('geographic_analysis')
        .select('*')
        .order('analysis_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      setAnalysis(newAnalysis);
      return data;
    } catch (err) {
      console.error('Error triggering analysis:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    analysis,
    loading,
    error,
    triggerAnalysis
  };
}