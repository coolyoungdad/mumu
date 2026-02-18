-- Migration 005: Withdrawal Requests
-- Add withdrawal support to PomPom
-- Run AFTER schema-v2.sql and migrations 001-004

-- 1. Add 'withdrawal' to the transaction_type enum
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'withdrawal';

-- 2. Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 10.00),
  paypal_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Indexes
CREATE INDEX idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests(status);
CREATE INDEX idx_withdrawal_requests_created_at ON public.withdrawal_requests(created_at);

-- 4. Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Users can view own withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert withdrawal requests" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update withdrawal requests" ON public.withdrawal_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- TO RUN IN SUPABASE: paste this entire file into the SQL editor and execute.
-- VERIFY: SELECT * FROM withdrawal_requests LIMIT 1;
-- VERIFY enum: SELECT unnest(enum_range(NULL::transaction_type));
