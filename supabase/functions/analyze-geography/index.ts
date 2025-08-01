import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CountryData {
  [key: string]: number;
}

interface RegionMapping {
  [key: string]: string[];
}

// Regional mapping for better analysis
const REGIONS: RegionMapping = {
  "North America": ["US", "CA", "MX"],
  "Europe": ["GB", "FR", "DE", "IT", "ES", "NL", "BE", "AT", "CH", "SE", "NO", "DK", "FI", "PL", "CZ", "SK", "HU", "RO", "BG", "HR", "SI", "EE", "LV", "LT", "IE", "PT", "GR", "CY", "MT", "LU"],
  "Asia Pacific": ["JP", "KR", "CN", "IN", "AU", "NZ", "SG", "TH", "MY", "PH", "ID", "VN", "TW", "HK", "MO"],
  "Latin America": ["BR", "AR", "CL", "CO", "PE", "VE", "EC", "BO", "UY", "PY", "GT", "HN", "SV", "NI", "CR", "PA", "CU", "DO", "JM", "TT", "BB", "GD", "LC", "VC", "AG", "KN", "DM"],
  "Middle East & Africa": ["AE", "SA", "EG", "ZA", "NG", "KE", "ET", "GH", "TZ", "UG", "ZW", "ZM", "MW", "MZ", "AO", "CM", "CI", "SN", "ML", "BF", "NE", "TD", "CF", "CG", "CD", "GA", "GQ", "ST", "DJ", "ER", "SO", "SS", "SD", "IL", "JO", "LB", "SY", "IQ", "IR", "AF", "PK", "BD", "LK", "MV", "BT", "NP", "MM", "KH", "LA", "BN", "TL"],
  "Other": []
};

function getRegionForCountry(countryCode: string): string {
  for (const [region, countries] of Object.entries(REGIONS)) {
    if (countries.includes(countryCode.toUpperCase())) {
      return region;
    }
  }
  return "Other";
}

function analyzeGeographicBalance(countryData: CountryData): {
  diversityScore: number;
  underrepresentedRegions: string[];
  recommendedTargets: string[];
} {
  const totalVideos = Object.values(countryData).reduce((sum, count) => sum + count, 0);
  
  if (totalVideos === 0) {
    return {
      diversityScore: 0,
      underrepresentedRegions: Object.keys(REGIONS).filter(r => r !== "Other"),
      recommendedTargets: ["Share your unique perspective from anywhere in the world!"]
    };
  }

  // Calculate regional distribution
  const regionalData: { [key: string]: number } = {};
  Object.keys(REGIONS).forEach(region => {
    regionalData[region] = 0;
  });

  Object.entries(countryData).forEach(([country, count]) => {
    const region = getRegionForCountry(country);
    regionalData[region] += count;
  });

  // Calculate diversity score (0-1, higher = more diverse)
  const regionCounts = Object.values(regionalData).filter(count => count > 0);
  const maxPossibleRegions = Object.keys(REGIONS).length - 1; // Exclude "Other"
  const diversityScore = regionCounts.length / maxPossibleRegions;

  // Find underrepresented regions (less than 10% of total videos)
  const threshold = totalVideos * 0.1;
  const underrepresentedRegions = Object.entries(regionalData)
    .filter(([region, count]) => region !== "Other" && count < threshold)
    .map(([region]) => region);

  // Generate recommended targets
  const recommendedTargets: string[] = [];
  
  if (totalVideos < 50) {
    recommendedTargets.push("Share your story from anywhere in the world!");
  } else if (underrepresentedRegions.length > 0) {
    const targetRegion = underrepresentedRegions[0];
    const countries = REGIONS[targetRegion];
    if (countries.length > 0) {
      const sampleCountries = countries.slice(0, 3);
      recommendedTargets.push(`We'd love voices from ${targetRegion} - especially ${sampleCountries.join(', ')}`);
    }
  } else {
    recommendedTargets.push("Share your unique local perspective!");
  }

  return {
    diversityScore: Math.round(diversityScore * 100) / 100,
    underrepresentedRegions,
    recommendedTargets
  };
}

async function analyzeGeographicData(supabase: any) {
  console.log('Starting geographic analysis...');
  
  // Get all public videos from the last 30 days with location data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: videos, error } = await supabase
    .from('videos')
    .select('location, created_at')
    .eq('is_public', true)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .not('location', 'is', null);

  if (error) {
    console.error('Error fetching videos:', error);
    throw error;
  }

  console.log(`Found ${videos?.length || 0} videos with location data`);

  // Count videos by country
  const countryData: CountryData = {};
  videos?.forEach(video => {
    if (video.location) {
      // Extract country code from location (assuming format like "US" or "New York, US")
      const parts = video.location.split(',').map(p => p.trim());
      const countryCode = parts[parts.length - 1].toUpperCase();
      
      countryData[countryCode] = (countryData[countryCode] || 0) + 1;
    }
  });

  const totalVideos = videos?.length || 0;
  const totalCountries = Object.keys(countryData).length;

  // Analyze geographic balance
  const analysis = analyzeGeographicBalance(countryData);

  // Store results in database
  const { error: insertError } = await supabase
    .from('geographic_analysis')
    .upsert({
      analysis_date: new Date().toISOString().split('T')[0],
      total_videos: totalVideos,
      total_countries: totalCountries,
      country_distribution: countryData,
      underrepresented_regions: analysis.underrepresentedRegions,
      diversity_score: analysis.diversityScore,
      recommended_targets: analysis.recommendedTargets
    }, {
      onConflict: 'analysis_date'
    });

  if (insertError) {
    console.error('Error storing analysis:', insertError);
    throw insertError;
  }

  console.log('Geographic analysis completed and stored');
  
  return {
    totalVideos,
    totalCountries,
    diversityScore: analysis.diversityScore,
    underrepresentedRegions: analysis.underrepresentedRegions,
    recommendedTargets: analysis.recommendedTargets
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const result = await analyzeGeographicData(supabase);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in analyze-geography function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});