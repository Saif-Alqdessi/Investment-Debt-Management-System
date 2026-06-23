-- ────────────────────────────────────────────────────────────────────────────
-- Migration 004: White-Label (Model B) — Role Enforcement + Signup Support
-- ────────────────────────────────────────────────────────────────────────────
-- What this does:
--   1. Ensures the `role` column exists on `profiles` with proper enum values
--   2. Adds a check constraint to enforce valid role values
--   3. Sets a default role of 'owner' for new signups
--   4. Creates an auto-profile trigger so that new auth users get a profile row
--      automatically (required for self-service signup to work without a
--      manual insert step)
--   5. Adds comments for documentation
--
-- Safe to run multiple times (all statements are idempotent).
-- ────────────────────────────────────────────────────────────────────────────

-- 1. Ensure `role` column exists
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'owner';

-- 2. Enforce valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('owner', 'admin', 'viewer'));
  END IF;
END $$;

-- 3. Comment
COMMENT ON COLUMN public.profiles.role IS
  'User role within this deployment: owner (full access), admin (edit/delete), viewer (read-only). '
  'For White-Label Model B, every instance has a single owner. '
  'For Multi-Tenant Model A, roles will be scoped to org_members.';

-- 4. Auto-create a profile row for new Supabase auth signups
--    This trigger fires AFTER a user is inserted into auth.users.
--    It prevents the "no profile found" error on first dashboard load.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'owner',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger so this migration is idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. RLS: Ensure users can read their own profile (required for role checks)
--    These policies are additive — existing policies are not affected.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
      AND policyname = 'profiles_select_own'
  ) THEN
    CREATE POLICY profiles_select_own ON public.profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
      AND policyname = 'profiles_update_own'
  ) THEN
    CREATE POLICY profiles_update_own ON public.profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
      AND policyname = 'profiles_insert_own'
  ) THEN
    CREATE POLICY profiles_insert_own ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 6. Make sure RLS is enabled on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
