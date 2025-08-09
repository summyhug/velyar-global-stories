-- Content Moderation System Migration
-- Add content moderation tables and functionality

-- Add content moderation columns to existing videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'hidden', 'removed'));
ALTER TABLE videos ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS removal_reason TEXT;

-- Add age verification to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'restricted', 'suspended'));

-- Create content reports table
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('inappropriate', 'spam', 'copyright', 'harassment', 'violence', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT,
  UNIQUE(video_id, reporter_id) -- Prevent duplicate reports from same user
);

-- Create content appeals table
CREATE TABLE IF NOT EXISTS content_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appeal_reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_id UUID REFERENCES auth.users(id)
);

-- Create user consent tracking table
CREATE TABLE IF NOT EXISTS user_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_moderation BOOLEAN NOT NULL DEFAULT false,
  data_processing BOOLEAN NOT NULL DEFAULT false,
  community_guidelines BOOLEAN NOT NULL DEFAULT false,
  age_verification BOOLEAN NOT NULL DEFAULT false,
  marketing_emails BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create moderation actions log table
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('flag', 'hide', 'remove', 'restore', 'warn')),
  reason TEXT NOT NULL,
  moderator_id UUID REFERENCES auth.users(id),
  automated BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_reports
CREATE POLICY "Users can report content" 
ON content_reports 
FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" 
ON content_reports 
FOR SELECT 
USING (auth.uid() = reporter_id);

-- RLS Policies for content_appeals
CREATE POLICY "Users can appeal their own content" 
ON content_appeals 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM videos 
  WHERE videos.id = content_appeals.video_id 
  AND videos.user_id = auth.uid()
));

CREATE POLICY "Users can view their own appeals" 
ON content_appeals 
FOR SELECT 
USING (auth.uid() = user_id);

-- RLS Policies for user_consent
CREATE POLICY "Users can manage their own consent" 
ON user_consent 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for moderation_actions (read-only for transparency)
CREATE POLICY "Users can view actions on their content" 
ON moderation_actions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM videos 
  WHERE videos.id = moderation_actions.video_id 
  AND videos.user_id = auth.uid()
));

-- Function to handle content reports and auto-moderation
CREATE OR REPLACE FUNCTION handle_content_report()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for auto-moderation
DROP TRIGGER IF EXISTS content_report_trigger ON content_reports;
CREATE TRIGGER content_report_trigger
  AFTER INSERT ON content_reports
  FOR EACH ROW EXECUTE FUNCTION handle_content_report();

-- Function to update timestamp on consent changes
CREATE OR REPLACE FUNCTION update_consent_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for consent timestamp updates
DROP TRIGGER IF EXISTS consent_updated_at_trigger ON user_consent;
CREATE TRIGGER consent_updated_at_trigger
  BEFORE UPDATE ON user_consent
  FOR EACH ROW EXECUTE FUNCTION update_consent_timestamp();

-- Update videos policy to respect hidden status
DROP POLICY IF EXISTS "Public videos are viewable by everyone" ON videos;
CREATE POLICY "Public videos are viewable by everyone" 
ON videos 
FOR SELECT 
USING (is_public = true AND is_hidden = false);

-- Insert default consent for existing users (if any)
-- This ensures existing users have consent records
INSERT INTO user_consent (user_id, content_moderation, data_processing, community_guidelines, age_verification)
SELECT 
  id,
  true, -- Assume existing users consent to moderation
  true, -- Assume existing users consent to data processing
  true, -- Assume existing users accept guidelines
  true  -- Assume existing users are age verified
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_consent)
ON CONFLICT (user_id) DO NOTHING;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_videos_moderation_status ON videos(moderation_status);
CREATE INDEX IF NOT EXISTS idx_videos_is_hidden ON videos(is_hidden);
CREATE INDEX IF NOT EXISTS idx_content_reports_video_id ON content_reports(video_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_video_id ON moderation_actions(video_id);
