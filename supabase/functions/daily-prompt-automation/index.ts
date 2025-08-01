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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split('T')[0];
    
    console.log(`Starting daily automation for ${today}`);

    // Check if manual override exists for today
    const { data: manualPrompt } = await supabase
      .from('daily_prompts')
      .select('*')
      .eq('date', today)
      .eq('manual_override', true)
      .maybeSingle();

    if (manualPrompt) {
      console.log('Manual override exists, skipping AI generation');
      return new Response(JSON.stringify({ 
        message: 'Manual override exists for today',
        prompt: manualPrompt.prompt_text 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Deactivate previous prompts
    await supabase
      .from('daily_prompts')
      .update({ is_active: false })
      .neq('date', today);

    // Check if today's prompt already exists
    const { data: existingPrompt } = await supabase
      .from('daily_prompts')
      .select('*')
      .eq('date', today)
      .maybeSingle();

    if (existingPrompt) {
      console.log('Today\'s prompt already exists, activating it');
      await supabase
        .from('daily_prompts')
        .update({ is_active: true })
        .eq('id', existingPrompt.id);
      
      return new Response(JSON.stringify({ 
        message: 'Existing prompt activated',
        prompt: existingPrompt.prompt_text 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate new prompt using AI
    try {
      const generateResponse = await supabase.functions.invoke('generate-daily-prompt');
      
      if (generateResponse.error) {
        throw new Error(generateResponse.error.message);
      }

      const { prompt, theme_id } = generateResponse.data;

      // Create new daily prompt
      const { data: newPrompt, error: insertError } = await supabase
        .from('daily_prompts')
        .insert({
          date: today,
          prompt_text: prompt,
          theme_id: theme_id,
          is_active: true,
          manual_override: false
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to insert prompt: ${insertError.message}`);
      }

      console.log('Successfully created new AI-generated prompt:', prompt);

      return new Response(JSON.stringify({ 
        message: 'New AI prompt generated and activated',
        prompt: newPrompt.prompt_text,
        id: newPrompt.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (aiError) {
      console.error('AI generation failed, using fallback:', aiError);
      
      // Use fallback prompt
      const { data: fallbackPrompt } = await supabase
        .from('fallback_prompts')
        .select('*')
        .eq('is_used', false)
        .limit(1)
        .maybeSingle();

      const promptText = fallbackPrompt?.prompt_text || "what's something that made you smile today?";
      
      // Mark fallback as used
      if (fallbackPrompt) {
        await supabase
          .from('fallback_prompts')
          .update({ is_used: true, used_date: today })
          .eq('id', fallbackPrompt.id);
      }

      // Create fallback prompt entry
      const { data: newPrompt } = await supabase
        .from('daily_prompts')
        .insert({
          date: today,
          prompt_text: promptText,
          theme_id: null,
          is_active: true,
          manual_override: false
        })
        .select()
        .single();

      return new Response(JSON.stringify({ 
        message: 'Fallback prompt activated due to AI failure',
        prompt: newPrompt.prompt_text,
        id: newPrompt.id,
        fallback: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Daily automation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});