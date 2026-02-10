# Database Migration Steps

## ❗ CRITICAL: Run the SQL Migration

Your edge functions are deployed and secrets are set, but the **database tables** might not exist yet.

## Step 1: Check If You Ran the Migration

Did you already run the `subscriptions_schema.sql` file in your Supabase dashboard?

**If NO, follow steps below:**

## Step 2: Run the Migration in Supabase Dashboard

1. **Open Supabase SQL Editor:**
   https://supabase.com/dashboard/project/hvjchdgthkxqdvxrjero/editor

2. **Click "New Query"**

3. **Copy the entire contents** of `subscriptions_schema.sql`

4. **Paste into the SQL editor**

5. **Click "Run"** (or press Ctrl+Enter)

6. **Verify success** - should see "Success. No rows returned"

## Alternative: Quick Check

Run this query in Supabase SQL Editor to check if table exists:

```sql
SELECT COUNT(*) FROM subscriptions;
```

**If it errors** → Tables don't exist, run the migration
**If it returns** `0` or a number → Tables exist ✅

## After Running Migration

1. Refresh your app
2. Click "Start Free Trial"
3. Should now redirect to Stripe Checkout!

---

## Still Getting Errors?

If you still get errors after running the migration, let's check the edge function logs:

**Open a new terminal and run:**
```bash
npx supabase functions logs create-checkout-session --tail
```

**Then in your browser:**
1. Click "Start Free Trial"
2. Watch the terminal for the live error logs
3. Share the error message with me

This will show us the exact error from the edge function.
