-- ============================================================================
-- USERS & AUTHENTICATION (Managed by Supabase Auth)
-- ============================================================================

-- Supabase creates auth.users automatically. We extend with profiles.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'viewer')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INVESTMENTS MODULE
-- ============================================================================

-- Categories lookup table
CREATE TABLE public.investment_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,           -- 'Rateb', 'Fixed Deposit', etc.
    description TEXT,
    color TEXT DEFAULT '#3B82F6',        -- For UI badges
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main investments table
CREATE TABLE public.investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core fields from spreadsheet
    investor_name TEXT NOT NULL,
    principal_amount DECIMAL(15,2) NOT NULL CHECK (principal_amount > 0),
    starting_date DATE NOT NULL,
    due_date DATE NOT NULL,
    category_id UUID REFERENCES public.investment_categories(id),
    
    -- Duration as enum for consistency
    duration TEXT NOT NULL CHECK (duration IN ('annual', 'semi_annual', 'quarterly', 'monthly')),
    
    -- Rates (stored as decimals: 18% = 0.18)
    profit_rate DECIMAL(5,4) NOT NULL CHECK (profit_rate >= 0 AND profit_rate <= 1),
    commission_rate DECIMAL(5,4) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 1),
    
    -- Computed fields (stored for query performance, updated via trigger)
    profit_amount DECIMAL(15,2) GENERATED ALWAYS AS (principal_amount * profit_rate) STORED,
    commission_amount DECIMAL(15,2) GENERATED ALWAYS AS (principal_amount * commission_rate) STORED,
    total_payout DECIMAL(15,2) GENERATED ALWAYS AS (principal_amount + (principal_amount * profit_rate)) STORED,
    
    -- Status tracking
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'matured', 'renewed', 'withdrawn')),
    is_shared BOOLEAN DEFAULT FALSE,     -- Flag for shared investments
    
    -- Notes and metadata
    notes TEXT,
    
    -- Audit fields
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shared investors (child investments linked to parent)
CREATE TABLE public.shared_investors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to parent investment
    investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
    
    -- Sub-investor details
    investor_name TEXT NOT NULL,
    share_percentage DECIMAL(5,2) NOT NULL CHECK (share_percentage > 0 AND share_percentage <= 100),
    
    -- Computed share amounts (calculated from parent)
    share_principal DECIMAL(15,2) NOT NULL,
    share_profit DECIMAL(15,2) NOT NULL,
    share_commission DECIMAL(15,2) NOT NULL,
    share_total_payout DECIMAL(15,2) NOT NULL,
    
    -- Optional different commission rate for this sub-investor
    custom_commission_rate DECIMAL(5,4),
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure percentages don't exceed 100% per investment
    CONSTRAINT unique_investor_per_investment UNIQUE (investment_id, investor_name)
);

-- ============================================================================
-- DEBTS & TRUSTS MODULE
-- ============================================================================

CREATE TABLE public.debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core fields
    creditor_name TEXT NOT NULL,         -- Who is owed
    debtor_name TEXT NOT NULL,           -- Who owes
    principal_amount DECIMAL(15,2) NOT NULL CHECK (principal_amount > 0),
    currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'SAR', 'AED')),
    
    -- Dates
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    
    -- Optional interest
    interest_rate DECIMAL(5,4) DEFAULT 0,
    total_due DECIMAL(15,2) GENERATED ALWAYS AS (
        principal_amount + (principal_amount * COALESCE(interest_rate, 0))
    ) STORED,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'defaulted', 'forgiven')),
    amount_paid DECIMAL(15,2) DEFAULT 0,
    
    -- Classification
    debt_type TEXT DEFAULT 'personal' CHECK (debt_type IN ('personal', 'trust', 'business', 'loan')),
    
    -- Documents and notes
    notes TEXT,
    
    -- Audit
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment history for debts
CREATE TABLE public.debt_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS MODULE
-- ============================================================================

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- What this notification is about
    entity_type TEXT NOT NULL CHECK (entity_type IN ('investment', 'debt')),
    entity_id UUID NOT NULL,
    
    -- Notification details
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'maturity_30_days',
        'maturity_7_days', 
        'maturity_1_day',
        'maturity_today',
        'overdue',
        'payment_received'
    )),
    
    -- Scheduling
    scheduled_date DATE NOT NULL,
    sent_at TIMESTAMPTZ,
    is_sent BOOLEAN DEFAULT FALSE,
    
    -- Email details
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    
    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,                -- 'create', 'update', 'delete'
    entity_type TEXT NOT NULL,           -- 'investment', 'debt', etc.
    entity_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_investments_due_date ON public.investments(due_date);
CREATE INDEX idx_investments_status ON public.investments(status);
CREATE INDEX idx_investments_investor ON public.investments(investor_name);
CREATE INDEX idx_shared_investors_investment ON public.shared_investors(investment_id);
CREATE INDEX idx_debts_due_date ON public.debts(due_date);
CREATE INDEX idx_debts_status ON public.debts(status);
CREATE INDEX idx_notifications_scheduled ON public.notifications(scheduled_date, is_sent);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies (simplified - owner sees all)
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Authenticated users can access investments" ON public.investments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access shared_investors" ON public.shared_investors
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access debts" ON public.debts
    FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- TRIGGERS FOR AUTO-CALCULATIONS
-- ============================================================================

-- Update shared investor amounts when parent investment changes
CREATE OR REPLACE FUNCTION update_shared_investor_amounts()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.shared_investors
    SET 
        share_principal = NEW.principal_amount * (share_percentage / 100),
        share_profit = NEW.profit_amount * (share_percentage / 100),
        share_commission = CASE 
            WHEN custom_commission_rate IS NOT NULL 
            THEN NEW.principal_amount * (share_percentage / 100) * custom_commission_rate
            ELSE NEW.commission_amount * (share_percentage / 100)
        END,
        share_total_payout = (NEW.principal_amount + NEW.profit_amount) * (share_percentage / 100),
        updated_at = NOW()
    WHERE investment_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shared_amounts
    AFTER UPDATE ON public.investments
    FOR EACH ROW
    EXECUTE FUNCTION update_shared_investor_amounts();

-- Auto-generate notifications when investment is created
CREATE OR REPLACE FUNCTION generate_investment_notifications()
RETURNS TRIGGER AS $$
DECLARE
    investor_email TEXT;
BEGIN
    -- Get investor email (simplified - in production, link to profiles)
    SELECT email INTO investor_email FROM public.profiles LIMIT 1;
    
    -- 30-day reminder
    INSERT INTO public.notifications (entity_type, entity_id, notification_type, scheduled_date, recipient_email, subject, body)
    VALUES (
        'investment', 
        NEW.id, 
        'maturity_30_days',
        NEW.due_date - INTERVAL '30 days',
        COALESCE(investor_email, 'admin@example.com'),
        'Investment Maturing in 30 Days: ' || NEW.investor_name,
        'Your investment of $' || NEW.principal_amount || ' is maturing on ' || NEW.due_date
    );
    
    -- 7-day reminder
    INSERT INTO public.notifications (entity_type, entity_id, notification_type, scheduled_date, recipient_email, subject, body)
    VALUES (
        'investment', 
        NEW.id, 
        'maturity_7_days',
        NEW.due_date - INTERVAL '7 days',
        COALESCE(investor_email, 'admin@example.com'),
        'Investment Maturing in 7 Days: ' || NEW.investor_name,
        'Your investment of $' || NEW.principal_amount || ' is maturing on ' || NEW.due_date
    );
    
    -- Day-of reminder
    INSERT INTO public.notifications (entity_type, entity_id, notification_type, scheduled_date, recipient_email, subject, body)
    VALUES (
        'investment', 
        NEW.id, 
        'maturity_today',
        NEW.due_date,
        COALESCE(investor_email, 'admin@example.com'),
        'Investment Matured Today: ' || NEW.investor_name,
        'Your investment of $' || NEW.principal_amount || ' has matured today. Total payout: $' || NEW.total_payout
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_notifications
    AFTER INSERT ON public.investments
    FOR EACH ROW
    EXECUTE FUNCTION generate_investment_notifications();
