-- Property Portfolio Cashflow Forecaster Database Schema
-- Version: 1.0

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (ignore if already exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('client', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE property_type AS ENUM (
      'residential_house',
      'residential_unit', 
      'commercial_office',
      'commercial_retail',
      'commercial_industrial',
      'mixed_use'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE investment_strategy AS ENUM (
      'buy_hold',
      'manufacture_equity',
      'value_add_commercial'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE loan_type AS ENUM ('interest_only', 'principal_interest');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role user_role DEFAULT 'client',
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  status user_status DEFAULT 'active',
  notes TEXT,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolios table
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  globals JSONB NOT NULL,
  start_year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties table
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type property_type NOT NULL,
  address TEXT,
  purchase_price DECIMAL(12,2) NOT NULL,
  current_value DECIMAL(12,2) NOT NULL,
  purchase_date DATE NOT NULL,
  strategy investment_strategy NOT NULL,
  cashflow_status TEXT DEFAULT 'not_modeled',
  financial_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loans table
CREATE TABLE IF NOT EXISTS public.loans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  type loan_type NOT NULL,
  principal_amount DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,4) NOT NULL,
  term_years INTEGER NOT NULL,
  start_date DATE NOT NULL,
  rate_step_ups JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Results table
CREATE TABLE IF NOT EXISTS public.results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
  scenario TEXT DEFAULT 'single',
  engine_version TEXT NOT NULL,
  year_rows JSONB NOT NULL,
  kpis JSONB NOT NULL,
  events JSONB NOT NULL,
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consents table
CREATE TABLE IF NOT EXISTS public.consents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  version TEXT NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  diff JSONB,
  ip INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reference data tables

-- LMI reference table
CREATE TABLE IF NOT EXISTS public.reference_lmi (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lender_class TEXT NOT NULL,
  lvr_min DECIMAL(5,4) NOT NULL,
  lvr_max DECIMAL(5,4) NOT NULL,
  loan_min DECIMAL(12,2) NOT NULL,
  loan_max DECIMAL(12,2) NOT NULL,
  premium_pct DECIMAL(5,4) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stamp duty reference table
CREATE TABLE IF NOT EXISTS public.reference_stamp_duty (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  state TEXT NOT NULL,
  bracket_min DECIMAL(12,2) NOT NULL,
  bracket_max DECIMAL(12,2) NOT NULL,
  formula_text TEXT NOT NULL,
  first_home_flag BOOLEAN DEFAULT FALSE,
  investor_flag BOOLEAN DEFAULT FALSE,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Global defaults reference table
CREATE TABLE IF NOT EXISTS public.reference_defaults (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value_json JSONB NOT NULL,
  description TEXT,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cap rates reference table
CREATE TABLE IF NOT EXISTS public.reference_cap_rates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  region TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  cap_rate DECIMAL(5,4) NOT NULL,
  source TEXT,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reference data change log
CREATE TABLE IF NOT EXISTS public.reference_change_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ref_table TEXT NOT NULL,
  ref_id UUID NOT NULL,
  action TEXT NOT NULL,
  diff JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_portfolio_id ON public.properties(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_loans_property_id ON public.loans(property_id);
CREATE INDEX IF NOT EXISTS idx_results_portfolio_id ON public.results(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_consents_user_id ON public.consents(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Reference data indexes
CREATE INDEX IF NOT EXISTS idx_reference_lmi_effective ON public.reference_lmi(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_reference_stamp_duty_state_effective ON public.reference_stamp_duty(state, effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_reference_defaults_effective ON public.reference_defaults(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_reference_cap_rates_effective ON public.reference_cap_rates(effective_from, effective_to);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables (ignore if already enabled)
DO $$ BEGIN
  ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Users can only see their own data
DO $$ BEGIN
  CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Profiles policies
DO $$ BEGIN
  CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Portfolios policies
DO $$ BEGIN
  CREATE POLICY "Users can view own portfolios" ON public.portfolios
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create own portfolios" ON public.portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own portfolios" ON public.portfolios
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own portfolios" ON public.portfolios
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Properties policies (inherited from portfolio ownership)
DO $$ BEGIN
  CREATE POLICY "Users can view own properties" ON public.properties
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE portfolios.id = properties.portfolio_id 
        AND portfolios.user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create properties in own portfolios" ON public.properties
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE portfolios.id = properties.portfolio_id 
        AND portfolios.user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own properties" ON public.properties
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE portfolios.id = properties.portfolio_id 
        AND portfolios.user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own properties" ON public.properties
    FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE portfolios.id = properties.portfolio_id 
        AND portfolios.user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Loans policies (inherited from property ownership)
DO $$ BEGIN
  CREATE POLICY "Users can view own loans" ON public.loans
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.properties p
        JOIN public.portfolios pf ON p.portfolio_id = pf.id
        WHERE p.id = loans.property_id 
        AND pf.user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create loans on own properties" ON public.loans
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.properties p
        JOIN public.portfolios pf ON p.portfolio_id = pf.id
        WHERE p.id = loans.property_id 
        AND pf.user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own loans" ON public.loans
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM public.properties p
        JOIN public.portfolios pf ON p.portfolio_id = pf.id
        WHERE p.id = loans.property_id 
        AND pf.user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own loans" ON public.loans
    FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM public.properties p
        JOIN public.portfolios pf ON p.portfolio_id = pf.id
        WHERE p.id = loans.property_id 
        AND pf.user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Results policies
DO $$ BEGIN
  CREATE POLICY "Users can view own results" ON public.results
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE portfolios.id = results.portfolio_id 
        AND portfolios.user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create results for own portfolios" ON public.results
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE portfolios.id = results.portfolio_id 
        AND portfolios.user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Consents policies
DO $$ BEGIN
  CREATE POLICY "Users can view own consents" ON public.consents
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create own consents" ON public.consents
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Audit logs - only admins can view
DO $$ BEGIN
  CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "System can create audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Functions for admin override
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER IF NOT EXISTS update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_portfolios_updated_at BEFORE UPDATE ON public.portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_properties_updated_at BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_loans_updated_at BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_reference_lmi_updated_at BEFORE UPDATE ON public.reference_lmi
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_reference_stamp_duty_updated_at BEFORE UPDATE ON public.reference_stamp_duty
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_reference_defaults_updated_at BEFORE UPDATE ON public.reference_defaults
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_reference_cap_rates_updated_at BEFORE UPDATE ON public.reference_cap_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
