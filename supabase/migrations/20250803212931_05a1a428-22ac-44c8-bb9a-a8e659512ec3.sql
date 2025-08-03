-- Fix function search path for update_mission_participants_count
CREATE OR REPLACE FUNCTION public.update_mission_participants_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Handle INSERT or UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.mission_id IS NOT NULL AND NEW.is_public = true THEN
      UPDATE missions 
      SET participants_count = (
        SELECT COUNT(*) FROM videos 
        WHERE mission_id = NEW.mission_id AND is_public = true
      )
      WHERE id = NEW.mission_id;
    END IF;
  END IF;

  -- Handle DELETE or UPDATE (when changing mission_id or is_public)
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    IF OLD.mission_id IS NOT NULL THEN
      UPDATE missions 
      SET participants_count = (
        SELECT COUNT(*) FROM videos 
        WHERE mission_id = OLD.mission_id AND is_public = true
      )
      WHERE id = OLD.mission_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;