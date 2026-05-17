-- Migration: Add user preference columns to profiles table
-- Run this in your Supabase SQL Editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_currency TEXT NOT NULL DEFAULT 'SAR',
  ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS browser_notifications BOOLEAN NOT NULL DEFAULT false;

-- Comment for documentation
COMMENT ON COLUMN profiles.preferred_currency    IS 'User preferred currency code: SAR, USD, or TRY';
COMMENT ON COLUMN profiles.email_notifications   IS 'Whether the user wants email alerts for maturing investments';
COMMENT ON COLUMN profiles.browser_notifications IS 'Whether the user wants browser push notifications';
