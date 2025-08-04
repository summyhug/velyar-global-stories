-- Update existing videos to link them to the current daily prompt
UPDATE videos 
SET daily_prompt_id = (
  SELECT id FROM daily_prompts 
  WHERE is_active = true 
  LIMIT 1
)
WHERE daily_prompt_id IS NULL 
AND is_public = true;