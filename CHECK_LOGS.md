# Check Edge Function Logs in Dashboard

Since the CLI logs command doesn't work, let's check the Supabase dashboard directly.

## Step 1: Open Function Logs

1. Go to: https://supabase.com/dashboard/project/hvjchdgthkxqdvxrjero/functions
2. Click on **`create-checkout-session`**
3. Click the **"Logs"** tab
4. You'll see recent function invocations

## Step 2: Reproduce the Error

1. Keep the logs page open
2. In your app, click **"Start Free Trial"**
3. Watch the logs page refresh
4. Look for the latest error entry (marked in red)
5. Click on it to see the full error details

## Step 3: Share the Error

Copy the error message and share it with me. Common errors:

### Error: "Not authenticated"
**Cause:** User token not being passed correctly
**Fix:** Check if user is logged in

### Error: "relation 'subscriptions' does not exist"
**Cause:** Migration not run or RLS blocking access
**Fix:** Verify RLS policies

### Error: "No API key found"
**Cause:** Missing Stripe secret key
**Fix:** Already set, so unlikely

### Error: "Invalid price ID"
**Cause:** Price ID in .env doesn't match Stripe
**Fix:** Verify VITE_STRIPE_PRICE_MONTHLY matches your Stripe dashboard

## Alternative: Test Function Directly

Try invoking the function with curl to see raw response:

```bash
curl -i --location --request POST 'https://hvjchdgthkxqdvxrjero.supabase.co/functions/v1/create-checkout-session' \
  --header 'Authorization: Bearer YOUR_USER_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --data '{"priceId":"price_1SyZu2ESf91DrGyEmicC8ALM"}'
```

(Replace YOUR_USER_TOKEN_HERE with your actual user JWT from browser console: `localStorage.getItem('supabase.auth.token')`)

## Quick Debug: Add Console Logs

If we can't see dashboard logs, let me add better error handling to the Pricing page to show the exact error in the browser.
