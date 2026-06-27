
-- Drop Stripe columns
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS stripe_subscription_id;

-- Add RevenueCat columns
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS revenuecat_app_user_id text unique;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS revenuecat_entitlement_id text;

-- Drop Stripe indexes if they exist
DROP INDEX IF EXISTS subscriptions_stripe_customer_id_idx;

-- Create RevenueCat index
CREATE INDEX IF NOT EXISTS subscriptions_rc_app_user_id_idx ON public.subscriptions(revenuecat_app_user_id);

-- Update comments
COMMENT ON TABLE public.subscriptions IS 'Stores user subscription data from RevenueCat';
COMMENT ON COLUMN public.subscriptions.status IS 'RevenueCat subscription status: active, canceled, past_due, trialing, inactive';
COMMENT ON COLUMN public.subscriptions.revenuecat_app_user_id IS 'RevenueCat App User ID for payment management';
COMMENT ON COLUMN public.subscriptions.revenuecat_entitlement_id IS 'RevenueCat entitlement ID for webhook updates';
