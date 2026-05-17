-- Migration: Add user_id column to investments and debts for strict RLS multi-tenancy
-- Run this in your Supabase SQL Editor

-- ── investments ───────────────────────────────────────────────────────────────
ALTER TABLE investments
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Back-fill existing rows from created_by (if any)
UPDATE investments SET user_id = created_by WHERE user_id IS NULL AND created_by IS NOT NULL;

-- ── debts ─────────────────────────────────────────────────────────────────────
ALTER TABLE debts
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

UPDATE debts SET user_id = created_by WHERE user_id IS NULL AND created_by IS NOT NULL;

-- ── RLS policies for investments ──────────────────────────────────────────────
-- (Run only if RLS is enabled on the table)
DROP POLICY IF EXISTS "Users can view own investments"   ON investments;
DROP POLICY IF EXISTS "Users can insert own investments" ON investments;
DROP POLICY IF EXISTS "Users can update own investments" ON investments;
DROP POLICY IF EXISTS "Users can delete own investments" ON investments;

CREATE POLICY "Users can view own investments"
  ON investments FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investments"
  ON investments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments"
  ON investments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own investments"
  ON investments FOR DELETE USING (auth.uid() = user_id);

-- ── RLS policies for debts ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own debts"   ON debts;
DROP POLICY IF EXISTS "Users can insert own debts" ON debts;
DROP POLICY IF EXISTS "Users can update own debts" ON debts;
DROP POLICY IF EXISTS "Users can delete own debts" ON debts;

CREATE POLICY "Users can view own debts"
  ON debts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own debts"
  ON debts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debts"
  ON debts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own debts"
  ON debts FOR DELETE USING (auth.uid() = user_id);

-- ── RLS policy for profiles (update own row) ──────────────────────────────────
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
