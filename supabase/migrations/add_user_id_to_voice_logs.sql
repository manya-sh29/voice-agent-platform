-- Add user_id to voice_logs for scoping call history per user
ALTER TABLE voice_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
