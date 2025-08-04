-- Create video_themes entries for videos that have daily prompts with theme_id
INSERT INTO video_themes (video_id, theme_id)
SELECT DISTINCT v.id, dp.theme_id
FROM videos v
JOIN daily_prompts dp ON v.daily_prompt_id = dp.id
WHERE dp.theme_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM video_themes vt 
  WHERE vt.video_id = v.id AND vt.theme_id = dp.theme_id
);