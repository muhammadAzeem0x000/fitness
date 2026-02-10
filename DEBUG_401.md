# Debug 401 Error - Quick Checks

## Check 1: Are You Logged In?

In the browser console (F12 → Console tab), run:

```javascript
const { data: { user } } = await window.supabase.auth.getUser()
console.log('Current user:', user)
```

**If `user` is `null`** → You're not logged in! 
- Go to `/auth` and log in first
- Then try "Start Free Trial" again

**If user shows data** → You're logged in ✅, continue to Check 2

---

## Check 2: View Edge Function Logs

The exact error is in the Supabase dashboard:

**Open this URL:**
https://supabase.com/dashboard/project/hvjchdgthkxqdvxrjero/functions/create-checkout-session/logs

1. Keep this page open
2. In your app, click "Start Free Trial"
3. Refresh the logs page
4. Click on the latest error entry (red)
5. **Copy the full error message** and share it with me

Common errors you might see:
- "Not authenticated" → User auth token issue
- "permission denied for table subscriptions" → RLS policy issue
- "No API key" → Stripe secret key issue

---

## Check 3: Test with curl (Advanced)

Get your auth token from browser console:
```javascript
const token = (await window.supabase.auth.getSession()).data.session.access_token
console.log(token)
```

Then test the function directly:
```bash
curl -i POST "https://hvjchdgthkxqdvxrjero.supabase.co/functions/v1/create-checkout-session" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"priceId":"price_1SyZu2ESf91DrGyEmicC8ALM"}'
```

This will show the raw error response.

---

## Most Likely Issue: RLS Policies

The subscriptions table might have Row Level Security blocking even service role access. Let me know what the edge function logs say!
