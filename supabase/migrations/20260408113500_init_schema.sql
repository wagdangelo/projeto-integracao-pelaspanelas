-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'User',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create banks table
CREATE TABLE IF NOT EXISTS public.banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    account_number TEXT,
    bank_code TEXT,
    agency TEXT,
    account_digit TEXT,
    initial_balance NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chart_of_accounts table
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    "group" TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
    favorecido_type TEXT,
    created_by UUID REFERENCES auth.users(id),
    tax_id TEXT,
    email TEXT,
    phone TEXT,
    birth_date TEXT,
    gender TEXT,
    address_street TEXT,
    address_number TEXT,
    address_complement TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip_code TEXT,
    registration_date TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payees table
CREATE TABLE IF NOT EXISTS public.payees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transaction_categories table
CREATE TABLE IF NOT EXISTS public.transaction_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create entities table
CREATE TABLE IF NOT EXISTS public.entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create entregas_lojas table
CREATE TABLE IF NOT EXISTS public.entregas_lojas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data TEXT NOT NULL,
    turno TEXT NOT NULL,
    loja TEXT NOT NULL,
    quantidade NUMERIC DEFAULT 0,
    faturamento NUMERIC DEFAULT 0,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    launch_date TEXT NOT NULL,
    description TEXT NOT NULL,
    value NUMERIC NOT NULL,
    type TEXT NOT NULL,
    bank UUID REFERENCES public.banks(id),
    due_date TEXT,
    payment_date TEXT,
    payment_method UUID REFERENCES public.payment_methods(id),
    account_id UUID REFERENCES public.chart_of_accounts(id),
    payee UUID REFERENCES public.clients(id),
    status TEXT NOT NULL DEFAULT 'Pendente',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas_lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (Allow all authenticated users for MVP migration, can be restricted later)
DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public.profiles;
CREATE POLICY "Enable ALL for authenticated users" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public.banks;
CREATE POLICY "Enable ALL for authenticated users" ON public.banks FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public.chart_of_accounts;
CREATE POLICY "Enable ALL for authenticated users" ON public.chart_of_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public.clients;
CREATE POLICY "Enable ALL for authenticated users" ON public.clients FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public.payees;
CREATE POLICY "Enable ALL for authenticated users" ON public.payees FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public.payment_methods;
CREATE POLICY "Enable ALL for authenticated users" ON public.payment_methods FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public.transaction_categories;
CREATE POLICY "Enable ALL for authenticated users" ON public.transaction_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public.entities;
CREATE POLICY "Enable ALL for authenticated users" ON public.entities FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public.entregas_lojas;
CREATE POLICY "Enable ALL for authenticated users" ON public.entregas_lojas FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public.transactions;
CREATE POLICY "Enable ALL for authenticated users" ON public.transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
