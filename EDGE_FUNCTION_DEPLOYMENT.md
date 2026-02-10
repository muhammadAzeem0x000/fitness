# Edge Function Deployment & Testing Guide

## Quick Diagnosis: "Non-2xx status code" Error

This error means your Supabase Edge Function is either:
1. Not deployed
2. Missing environment variables
3. Returning an error

## Step 1: Check if Functions are Deployed

Run this command to see deployed functions:

```bash
supabase functions list
```

**Expected output:**
```
create-checkout-session
stripe-webhook
create-portal-session
```

If they're **NOT listed**, continue to Step 2.

---

## Step 2: Deploy the Edge Functions

### A. Link Your Supabase Project (if not done)

```bash
npx supabase link --project-ref hvjchdgthkxqdvxrjero
```

It will ask for your database password. Enter it when prompted.

### B. Deploy All Functions

```bash
cd "c:\Users\AZEEM\Desktop\Antigravity Project"

npx supabase functions deploy create-checkout-session
npx supabase functions deploy stripe-webhook
npx supabase functions deploy create-portal-session
```

### C. Set Environment Secrets

**CRITICAL:** Edge functions need these secrets to work:

```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE

npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
```

**To get your SERVICE_ROLE_KEY:**
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/hvjchdgthkxqdvxrjero
2. Settings → API
3. Copy the `service_role` key (the secret one, NOT the anon key)
4. Replace `YOUR_SERVICE_ROLE_KEY_HERE` in the command above

---

## Step 3: Test the Function

After deploying, test it directly:

```bash
npx supabase functions invoke create-checkout-session --method POST --body '{"priceId":"price_1SyZu2ESf91DrGyEmicC8ALM"}'
```

**Expected response:**
```json
{"sessionId":"cs_test_..."}
```

**If you get an error**, check the logs:

```bash
npx supabase functions logs create-checkout-session
```

---

## Common Issues & Fixes

### Issue 1: "Function not found"
**Fix:** Deploy the function (Step 2B)

### Issue 2: "Missing environment variable"
**Fix:** Set secrets (Step 2C)

### Issue 3: "Not authenticated"
**Fix:** Make sure you're logged in:
```bash
npx supabase login
npx supabase link --project-ref hvjchdgthkxqdvxrjero
```

### Issue 4: "CORS error" in browser
**Fix:** The edge function already has CORS headers. Make sure you deployed the latest version.

---

## Quick Checklist

- [ ] Install Supabase CLI: `npm install -g supabase` (if needed)
- [ ] Link project: `npx supabase link --project-ref hvjchdgthkxqdvxrjero`
- [ ] Deploy checkout function: `npx supabase functions deploy create-checkout-session`
- [ ] Deploy webhook function: `npx supabase functions deploy stripe-webhook`
- [ ] Deploy portal function: `npx supabase functions deploy create-portal-session`
- [ ] Set Stripe secret key: `npx supabase secrets set STRIPE_SECRET_KEY=...`
- [ ] Set webhook secret: `npx supabase secrets set STRIPE_WEBHOOK_SECRET=...`
- [ ] Set Supabase service role: `npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...`
- [ ] Test function: `npx supabase functions invoke create-checkout-session ...`
- [ ] Check logs if error: `npx supabase functions logs create-checkout-session`

---

## After Deployment

1. Refresh your app page
2. Try clicking "Start Free Trial" again
3. It should redirect to Stripe Checkout

If still having issues, run:
```bash
npx supabase functions logs create-checkout-session --tail
```

Then click the button again and watch the live logs for the exact error message.
