-- Add new columns to profiles table if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS workout_days text[] DEFAULT '{}';

COMMENT ON COLUMN public.profiles.display_name IS 'User display name for AI interaction';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user avatar image';
COMMENT ON COLUMN public.profiles.workout_days IS 'Preferred workout days (e.g. Monday, Wednesday)';
