-- ============================================================
-- Migration: Fix schema to match application server actions
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. INVESTMENTS TABLE
-- Ensure profit_amount, commission_amount, total_payout columns exist
-- (they may already exist if created by initial migration)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'investments' AND column_name = 'profit_amount'
  ) THEN
    ALTER TABLE public.investments ADD COLUMN profit_amount numeric DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'investments' AND column_name = 'commission_amount'
  ) THEN
    ALTER TABLE public.investments ADD COLUMN commission_amount numeric DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'investments' AND column_name = 'total_payout'
  ) THEN
    ALTER TABLE public.investments ADD COLUMN total_payout numeric DEFAULT 0;
  END IF;
END $$;

-- 1c. Fix created_by FK on investments to reference auth.users instead of profiles
-- Drop the existing FK constraint on created_by if it points to profiles
DO $$ 
DECLARE
  fk_name text;
BEGIN
  SELECT tc.constraint_name INTO fk_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
  WHERE tc.table_name = 'investments'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.column_name = 'id'
    AND EXISTS (
      SELECT 1 FROM information_schema.key_column_usage kcu
      WHERE kcu.constraint_name = tc.constraint_name AND kcu.column_name = 'created_by'
    )
  LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.investments DROP CONSTRAINT ' || fk_name;
  END IF;
END $$;

-- Re-add FK pointing to auth.users(id)
ALTER TABLE public.investments
  ADD CONSTRAINT investments_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 1d. Fix created_by FK on debts to reference auth.users instead of profiles
DO $$ 
DECLARE
  fk_name text;
BEGIN
  SELECT tc.constraint_name INTO fk_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
  WHERE tc.table_name = 'debts'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.column_name = 'id'
    AND EXISTS (
      SELECT 1 FROM information_schema.key_column_usage kcu
      WHERE kcu.constraint_name = tc.constraint_name AND kcu.column_name = 'created_by'
    )
  LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.debts DROP CONSTRAINT ' || fk_name;
  END IF;
END $$;

ALTER TABLE public.debts
  ADD CONSTRAINT debts_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 1b. INVESTMENTS: Change category_id from UUID FK to TEXT
-- (User has already done this in Supabase, but include for completeness)
-- Drop the FK constraint if it exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name LIKE '%category%' AND table_name = 'investments'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE public.investments DROP CONSTRAINT ' || constraint_name
      FROM information_schema.table_constraints
      WHERE constraint_name LIKE '%category%' AND table_name = 'investments'
      LIMIT 1
    );
  END IF;
END $$;

-- Change column type to TEXT if it isn't already
ALTER TABLE public.investments ALTER COLUMN category_id TYPE text USING category_id::text;

-- 2. DEBTS TABLE
-- Make due_date nullable (was NOT NULL)
ALTER TABLE public.debts ALTER COLUMN due_date DROP NOT NULL;

-- Make interest_rate nullable (was NOT NULL)
ALTER TABLE public.debts ALTER COLUMN interest_rate DROP NOT NULL;
ALTER TABLE public.debts ALTER COLUMN interest_rate SET DEFAULT NULL;

-- Add remaining_amount column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'debts' AND column_name = 'remaining_amount'
  ) THEN
    ALTER TABLE public.debts ADD COLUMN remaining_amount numeric DEFAULT 0;
  END IF;
END $$;

-- Ensure total_due column exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'debts' AND column_name = 'total_due'
  ) THEN
    ALTER TABLE public.debts ADD COLUMN total_due numeric DEFAULT 0;
  END IF;
END $$;

-- 3. DEBT_PAYMENTS TABLE
-- Add recorded_by column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'debt_payments' AND column_name = 'recorded_by'
  ) THEN
    ALTER TABLE public.debt_payments ADD COLUMN recorded_by uuid REFERENCES auth.users(id);
  END IF;
END $$;


-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS and allow authenticated users to CRUD their own data
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe to run even if they don't exist)
DROP POLICY IF EXISTS "Users can view their own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can insert their own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can update their own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can delete their own investments" ON public.investments;

DROP POLICY IF EXISTS "Users can view shared investors" ON public.shared_investors;
DROP POLICY IF EXISTS "Users can insert shared investors" ON public.shared_investors;
DROP POLICY IF EXISTS "Users can update shared investors" ON public.shared_investors;
DROP POLICY IF EXISTS "Users can delete shared investors" ON public.shared_investors;

DROP POLICY IF EXISTS "Users can view their own debts" ON public.debts;
DROP POLICY IF EXISTS "Users can insert their own debts" ON public.debts;
DROP POLICY IF EXISTS "Users can update their own debts" ON public.debts;
DROP POLICY IF EXISTS "Users can delete their own debts" ON public.debts;

DROP POLICY IF EXISTS "Users can view payments for their debts" ON public.debt_payments;
DROP POLICY IF EXISTS "Users can insert payments for their debts" ON public.debt_payments;
DROP POLICY IF EXISTS "Users can update payments for their debts" ON public.debt_payments;
DROP POLICY IF EXISTS "Users can delete payments for their debts" ON public.debt_payments;

-- INVESTMENTS: Authenticated users can do everything on their own rows
CREATE POLICY "Users can view their own investments"
  ON public.investments FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own investments"
  ON public.investments FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own investments"
  ON public.investments FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own investments"
  ON public.investments FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- SHARED_INVESTORS: Allow via parent investment ownership
CREATE POLICY "Users can view shared investors"
  ON public.shared_investors FOR SELECT
  TO authenticated
  USING (
    investment_id IN (
      SELECT id FROM public.investments WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert shared investors"
  ON public.shared_investors FOR INSERT
  TO authenticated
  WITH CHECK (
    investment_id IN (
      SELECT id FROM public.investments WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update shared investors"
  ON public.shared_investors FOR UPDATE
  TO authenticated
  USING (
    investment_id IN (
      SELECT id FROM public.investments WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete shared investors"
  ON public.shared_investors FOR DELETE
  TO authenticated
  USING (
    investment_id IN (
      SELECT id FROM public.investments WHERE created_by = auth.uid()
    )
  );

-- DEBTS: Authenticated users can do everything on their own rows
CREATE POLICY "Users can view their own debts"
  ON public.debts FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own debts"
  ON public.debts FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own debts"
  ON public.debts FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own debts"
  ON public.debts FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- DEBT_PAYMENTS: Allow via parent debt ownership
CREATE POLICY "Users can view payments for their debts"
  ON public.debt_payments FOR SELECT
  TO authenticated
  USING (
    debt_id IN (
      SELECT id FROM public.debts WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert payments for their debts"
  ON public.debt_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    debt_id IN (
      SELECT id FROM public.debts WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update payments for their debts"
  ON public.debt_payments FOR UPDATE
  TO authenticated
  USING (
    debt_id IN (
      SELECT id FROM public.debts WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete payments for their debts"
  ON public.debt_payments FOR DELETE
  TO authenticated
  USING (
    debt_id IN (
      SELECT id FROM public.debts WHERE created_by = auth.uid()
    )
  );
