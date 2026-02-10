-- Fix RLS policies for edge functions with service role access
-- Run this in Supabase SQL Editor

-- Add service role bypass policy for subscriptions table
-- This allows edge functions using service_role key to bypass RLS
create policy "Service role can manage all subscriptions"
  on public.subscriptions
  for all
  using (auth.role() = 'service_role');

-- Also add for feature_usage table
create policy "Service role can manage all usage"
  on public.feature_usage  
  for all
  using (auth.role() = 'service_role');

-- Verify policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('subscriptions', 'feature_usage');
