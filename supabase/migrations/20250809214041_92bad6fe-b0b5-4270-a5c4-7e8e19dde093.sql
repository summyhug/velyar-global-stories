-- Harden functions by setting a fixed search_path and security definer
CREATE OR REPLACE FUNCTION public.handle_content_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update report count on the video
  UPDATE videos 
  SET report_count = report_count + 1 
  WHERE id = NEW.video_id;
  
  -- Auto-hide videos with 3 or more reports
  IF (SELECT report_count FROM videos WHERE id = NEW.video_id) >= 3 THEN
    UPDATE videos 
    SET is_hidden = true, moderation_status = 'flagged'
    WHERE id = NEW.video_id;
    
    -- Log the automated action
    INSERT INTO moderation_actions (video_id, action_type, reason, automated)
    VALUES (NEW.video_id, 'hide', 'Auto-hidden due to multiple reports', true);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_consent_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;