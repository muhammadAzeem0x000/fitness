# SmartFit Monetization - Manual Setup Guide

This guide covers the manual steps required to complete the subscription system setup.

## ✅ Already Completed

- [x] Database schema created
- [x] Dependencies installed
- [x] Frontend code implemented
- [x] Edge Functions created

---

## 🔴 REQUIRED MANUAL STEPS

### 1. Create Stripe Products & Get Price IDs (5 minutes)

1. **Sign in to Stripe Dashboard**: https://dashboard.stripe.com
2. **Create Products**:
   - Click "Products" → "Add product"
   
   **Product 1: SmartFit Pro Monthly**
   - Name: `SmartFit Pro Monthly`
   - Price: `$9.99 USD`
   - Billing period: `Monthly`
   - Click "Save product"
   - **Copy the Price ID** (starts with `price_...`)
   
   **Product 2: SmartFit Pro Yearly**
   - Name: `SmartFit Pro Yearly`
   - Price: `$89.99 USD`
   - Billing period: `Yearly`
   - Click "Save product"
   - **Copy the Price ID** (starts with `price_...`)

3. **Update `.env.local`**:
   ```env
   VITE_STRIPE_PRICE_MONTHLY=price_YOUR_MONTHLY_ID_HERE
   VITE_STRIPE_PRICE_YEARLY=price_YOUR_YEARLY_ID_HERE
   ```

---

### 2. Deploy Supabase Edge Functions (10 minutes)

You need to deploy the 3 edge functions to Supabase.

#### Prerequisites:
- Install Supabase CLI: `npm install -g supabase`
- Link your project: `supabase link --project-ref YOUR_PROJECT_REF`

#### Deploy Commands:

```bash
# Navigate to project root
cd "c:\Users\AZEEM\Desktop\Antigravity Project"

# Deploy all functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy create-portal-session

# Set environment secrets (required for functions to work)
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

**Get your Service Role Key:**
- Supabase Dashboard → Settings → API → `service_role` key (secret)

---

### 3. Configure Stripe Webhook (5 minutes)

Stripe needs to send events to your webhook handler when subscriptions change.

1. **Go to Stripe Dashboard** → Developers → Webhooks
2. **Click "Add endpoint"**
3. **Endpoint URL**: 
   ```
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
   ```
   (Replace `YOUR_PROJECT_REF` with your actual Supabase project reference)

4. **Select events to listen to:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. **Click "Add endpoint"**

6. **Get Webhook Signing Secret**:
   - Click on your newly created webhook
   - Click "Reveal" next to "Signing secret"
   - Copy the secret (starts with `whsec_...`)

7. **Update `.env.local`**:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

8. **Also set it in Supabase secrets** (if not done in step 2):
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
   ```

---

### 4. Test the Integration (10 minutes)

#### Test Mode Testing:

1. **Use Stripe Test Cards**:
   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

2. **Test the Flow**:
   - Visit `/pricing` page
   - Click "Start Free Trial"
   - Complete checkout with test card
   - You should be redirected to `/success`
   - Check Supabase `subscriptions` table - status should be `trialing`

3. **Test Free Tier Limits**:
   - Create a new account
   - Try to generate 2 AI reports
   - Second one should show upgrade prompt

4. **Test Webhook**:
   - Use Stripe CLI to test webhooks locally:
     ```bash
     stripe listen --forward-to https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
     ```

---

### 5. Enable Stripe Customer Portal (2 minutes)

This allows users to manage their subscription (update card, cancel, etc.)

1. **Go to Stripe Dashboard** → Settings → Billing → Customer portal
2. **Click "Configure"**
3. **Enable features**:
   - ✅ Update payment method
   - ✅ Cancel subscriptions
   - ✅ View invoice history
4. **Click "Save"**

---

### 6. Switch to Production (When Ready)

⚠️ **Only do this when you're ready to accept real payments!**

1. **Get Live API Keys**:
   - Stripe Dashboard → Developers → API keys
   - Toggle "Viewing test data" → OFF
   - Copy live keys (`pk_live_...` and `sk_live_...`)

2. **Update `.env.local`**:
   ```env
   VITE_STRIPE_PUBLIC_KEY=pk_live_YOUR_LIVE_KEY
   STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
   ```

3. **Update Supabase Secrets**:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
   ```

4. **Create Live Webhook**:
   - Repeat Step 3 but with live mode enabled
   - Add live webhook secret to Supabase secrets

5. **Create Live Products**:
   - Repeat Step 1 but in live mode
   - Update price IDs in `.env.local`

---

## 📋 Verification Checklist

Before going live, verify:

- [ ] All 3 edge functions deployed successfully
- [ ] Stripe products created with correct prices
- [ ] Price IDs added to `.env.local`
- [ ] Webhook configured and receiving events
- [ ] Test subscription flow works end-to-end
- [ ] Free tier limits work correctly
- [ ] Customer portal accessible
- [ ] All environment variables set correctly

---

## 🐛 Troubleshooting

### "Failed to create checkout session"
- Check that `VITE_STRIPE_PUBLIC_KEY` is in `.env.local`
- Verify edge function is deployed: `supabase functions list`
- Check edge function logs: `supabase functions logs create-checkout-session`

### "Subscription not updating after payment"
- Verify webhook is configured correctly
- Check webhook is receiving events in Stripe Dashboard
- View webhook logs: `supabase functions logs stripe-webhook`
- Ensure database trigger is working (check `subscriptions` table)

### "Free tier limit not working"
- Check `feature_usage` table exists
- Verify RLS policies allow user to read/write
- Check browser console for errors

---

## 🎉 You're Done!

Once all manual steps are complete, your subscription system is fully functional!

**Next steps:**
- Test thoroughly in test mode
- Add more premium features as needed
- Monitor Stripe Dashboard for subscriptions
- Celebrate! 🎊
