-- Reset participant counts to zero since there are no actual videos
UPDATE missions 
SET participants_count = 0 
WHERE is_active = true;

-- Add a trigger to automatically update participant counts when videos are added/removed
CREATE OR REPLACE FUNCTION update_mission_participants_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_mission_participants ON videos;
CREATE TRIGGER trigger_update_mission_participants
  AFTER INSERT OR UPDATE OR DELETE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_mission_participants_count();