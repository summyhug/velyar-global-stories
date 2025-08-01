import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get available themes
    const { data: themes } = await supabase
      .from('themes')
      .select('id, name, description')
      .eq('is_active', true);

    const themesText = themes?.map(t => `- ${t.name}: ${t.description}`).join('\n') || '';

    const systemPrompt = `You are creating daily prompts for Velyar, a global video sharing platform.

COMPANY VALUES & GUIDELINES:
- Foster authentic human connection across cultures
- Encourage wholesome, family-friendly content  
- Promote curiosity about daily life worldwide
- Be inclusive and culturally sensitive
- Avoid controversial topics (politics, religion, etc.)

AVAILABLE THEMES:
${themesText}

PROMPT REQUIREMENTS:
- Ask about universal human experiences
- Use simple, clear language (max 80 characters)
- Be specific enough to inspire but broad enough for all cultures
- Return JSON with: {"prompt": "your prompt text", "theme_name": "theme_name"}

Generate a daily prompt that will inspire people worldwide to share authentic experiences.`;

    // Generate prompt with OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate a daily prompt for today.' }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generated = JSON.parse(data.choices[0].message.content);
    
    // Find matching theme
    const selectedTheme = themes?.find(t => 
      t.name.toLowerCase() === generated.theme_name?.toLowerCase()
    );

    // Log the generation attempt
    await supabase.from('prompt_generation_logs').insert({
      generated_prompt: generated.prompt,
      theme_name: generated.theme_name,
      openai_response: data,
      status: 'success'
    });

    console.log('Generated prompt:', generated.prompt);

    return new Response(JSON.stringify({
      prompt: generated.prompt,
      theme_id: selectedTheme?.id || null,
      theme_name: generated.theme_name
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating prompt:', error);
    
    // Log the error
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    await supabase.from('prompt_generation_logs').insert({
      generated_prompt: null,
      theme_name: null,
      openai_response: null,
      status: 'error',
      error_message: error.message
    });

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});