-- ============================================
-- Subscriptions & Monetization Schema
-- ============================================
-- Run this SQL in your Supabase SQL Editor to add subscription support

-- 1. Create subscriptions table
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  revenuecat_app_user_id text unique,
  revenuecat_entitlement_id text,
  status text not null default 'inactive',
  -- Status values: 'active', 'canceled', 'past_due', 'trialing', 'inactive'
  plan_id text, 
  -- Plan IDs: 'pro_monthly', 'pro_yearly', 'free'
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.subscriptions enable row level security;

-- Policies
create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can update own subscription"
  on public.subscriptions for update
  using (auth.uid() = user_id);

create policy "Users can insert own subscription"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

-- Indexes for performance
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_rc_app_user_id_idx on public.subscriptions(revenuecat_app_user_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);

-- 2. Add premium fields to profiles table
alter table public.profiles 
  add column if not exists is_premium boolean default false,
  add column if not exists subscription_id uuid references public.subscriptions(id);

-- 3. Create feature_usage table for rate limiting
create table if not exists public.feature_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  feature_name text not null, 
  -- Feature names: 'ai_report_daily', 'ai_report_weekly', 'ai_report_monthly', 'ai_report_total'
  usage_count integer default 0,
  last_used_at timestamp with time zone default timezone('utc'::text, now()) not null,
  period_start timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.feature_usage enable row level security;

-- Policies
create policy "Users can view own usage"
  on public.feature_usage for select
  using (auth.uid() = user_id);

create policy "Users can update own usage"
  on public.feature_usage for update
  using (auth.uid() = user_id);

create policy "Users can insert own usage"
  on public.feature_usage for insert
  with check (auth.uid() = user_id);

-- Indexes
create index if not exists feature_usage_user_id_idx on public.feature_usage(user_id);
create index if not exists feature_usage_feature_name_idx on public.feature_usage(feature_name);

-- 4. Create function to update subscription status
create or replace function update_user_premium_status()
returns trigger as $$
begin
  -- Update is_premium flag in profiles when subscription changes
  update public.profiles
  set 
    is_premium = (NEW.status = 'active' or NEW.status = 'trialing'),
    subscription_id = NEW.id
  where id = NEW.user_id;
  
  return NEW;
end;
$$ language plpgsql security definer;

-- Trigger to auto-update premium status
drop trigger if exists on_subscription_change on public.subscriptions;
create trigger on_subscription_change
  after insert or update on public.subscriptions
  for each row
  execute function update_user_premium_status();

-- 5. Initialize free tier for existing users
insert into public.subscriptions (user_id, status, plan_id)
select 
  id as user_id,
  'inactive' as status,
  'free' as plan_id
from auth.users
where not exists (
  select 1 from public.subscriptions where user_id = auth.users.id
);

-- Comments for documentation
comment on table public.subscriptions is 'Stores user subscription data from RevenueCat';
comment on table public.feature_usage is 'Tracks usage of rate-limited features for free users';
comment on column public.subscriptions.status is 'RevenueCat subscription status: active, canceled, past_due, trialing, inactive';
comment on column public.subscriptions.revenuecat_app_user_id is 'RevenueCat App User ID for payment management';
comment on column public.subscriptions.revenuecat_entitlement_id is 'RevenueCat entitlement ID for webhook updates';

-- Success message
do $$
begin
  raise notice 'Subscription schema created successfully!';
  raise notice 'Next steps:';
  raise notice '1. Create RevenueCat account and get API keys';
  raise notice '2. Add VITE_REVENUECAT_API_KEY to .env.local';
  raise notice '3. Install RevenueCat SDK: npm install @revenuecat/purchases-capacitor';
end $$;
