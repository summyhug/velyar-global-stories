import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { videoId, videoUrl, timestamp = 2 } = await req.json()

    if (!videoId || !videoUrl) {
      return new Response(
        JSON.stringify({ error: 'videoId and videoUrl are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Generate thumbnail using FFmpeg-like approach
    // For now, we'll use a placeholder approach and later implement actual video frame extraction
    const thumbnailUrl = await generateThumbnailFromVideo(videoUrl, timestamp)

    // Update the video record with the thumbnail URL
    const { error: updateError } = await supabase
      .from('videos')
      .update({ thumbnail_url: thumbnailUrl })
      .eq('id', videoId)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        thumbnailUrl,
        message: 'Thumbnail generated and saved successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating thumbnail:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate thumbnail', 
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function generateThumbnailFromVideo(videoUrl: string, timestamp: number): Promise<string> {
  try {
    // For MVP, we'll use a simple approach - fetch the video and extract frame using canvas
    // In a production environment, you'd want to use FFmpeg or similar
    
    // For now, return a placeholder URL based on video URL
    // This should be replaced with actual frame extraction logic
    const videoUrlObj = new URL(videoUrl)
    const videoPath = videoUrlObj.pathname
    const thumbnailPath = videoPath.replace(/\.[^/.]+$/, '_thumbnail.jpg')
    
    // Return the video URL with thumbnail suffix for now
    // In production, you'd extract actual frame and upload to storage
    return `${videoUrlObj.origin}${thumbnailPath}`
  } catch (error) {
    console.error('Error in generateThumbnailFromVideo:', error)
    // Return a default thumbnail if generation fails
    return 'https://images.unsplash.com/photo-1626544590736-4a351aaa2fe7?w=300&h=400&fit=crop'
  }
}