# Set Environment Secrets Commands

Run these commands one by one in your terminal:

## 1. Set Stripe Secret Key
```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE
```

## 2. Set Stripe Webhook Secret
```bash
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

## 3. Get and Set Supabase Service Role Key

**Where to find it:**
1. Go to: https://supabase.com/dashboard/project/hvjchdgthkxqdvxrjero/settings/api
2. Look for "Project API keys" section
3. Find the **`service_role`** key (it's marked as "secret")
4. Click "Reveal" and copy it

**Then run:**
```bash
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_COPIED_SERVICE_ROLE_KEY
```

## 4. Verify Secrets are Set
```bash
npx supabase secrets list
```

**You should see:**
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET  
- SUPABASE_SERVICE_ROLE_KEY

## 5. After Setting Secrets

The functions will automatically use the new secrets. No need to redeploy!

Test by clicking "Start Free Trial" again in your app.
