-- Migration: Fix schema security
-- 1) Add user_id to investment_categories to prevent global data-leak
-- 2) Enable RLS and add policies for investment_categories
-- 3) Enable RLS and add policies for audit_log

-- ── investment_categories ─────────────────────────────────────────────────────
ALTER TABLE investment_categories
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE investment_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own investment_categories" ON investment_categories;
DROP POLICY IF EXISTS "Users can insert own investment_categories" ON investment_categories;
DROP POLICY IF EXISTS "Users can update own investment_categories" ON investment_categories;
DROP POLICY IF EXISTS "Users can delete own investment_categories" ON investment_categories;

CREATE POLICY "Users can view own investment_categories"
  ON investment_categories FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investment_categories"
  ON investment_categories FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investment_categories"
  ON investment_categories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own investment_categories"
  ON investment_categories FOR DELETE USING (auth.uid() = user_id);

-- ── audit_log ─────────────────────────────────────────────────────────────────
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own audit_log" ON audit_log;
DROP POLICY IF EXISTS "Users can insert own audit_log" ON audit_log;

CREATE POLICY "Users can view own audit_log"
  ON audit_log FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit_log"
  ON audit_log FOR INSERT WITH CHECK (auth.uid() = user_id);
