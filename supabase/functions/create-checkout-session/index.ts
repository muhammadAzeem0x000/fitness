import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import Stripe from "npm:stripe@14"

console.log("✅ Function initialized successfully");

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    console.log("🚀 Request received:", req.method);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get auth header
        const authHeader = req.headers.get('Authorization');
        console.log('📥 Auth header:', authHeader ? 'Present' : 'MISSING');

        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Missing Authorization header' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            );
        }

        // Initialize Stripe
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeKey) {
            throw new Error('STRIPE_SECRET_KEY not configured');
        }
        const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

        // Create Supabase client with user auth
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        // Verify user
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        console.log('👤 User:', user?.email || 'NONE', 'Error:', userError?.message || 'none');

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            );
        }

        // Create admin client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Get request body
        const { priceId } = await req.json();
        console.log('💰 Price ID:', priceId);

        if (!priceId) {
            throw new Error('Price ID is required');
        }

        // Check for existing customer — fetch ALL subscription records to detect prior usage
        const { data: subscriptions } = await supabaseAdmin
            .from('subscriptions')
            .select('stripe_customer_id, stripe_subscription_id, status, current_period_end')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        let customerId = subscriptions?.[0]?.stripe_customer_id;

        // A user has "used their trial" if ANY subscription row shows prior checkout activity:
        // 1. They have any row with a stripe_subscription_id (went through checkout before)
        // 2. Their status is/was trialing, active, canceled, or past_due
        const dbHasUsedTrial = subscriptions?.some(sub =>
            sub.stripe_subscription_id ||
            ['trialing', 'active', 'canceled', 'past_due'].includes(sub.status)
        ) ?? false;

        // Create customer if needed
        if (!customerId) {
            console.log('Creating new Stripe customer');
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { supabase_user_id: user.id },
            });
            customerId = customer.id;

            await supabaseAdmin
                .from('subscriptions')
                .upsert({
                    user_id: user.id,
                    stripe_customer_id: customerId,
                    status: 'inactive',
                });
        }

        // SAFETY NET: Also check Stripe directly for any past subscriptions on this customer
        // This catches cases where the DB state is out of sync (e.g. broken webhook)
        let stripeHasPastSubs = false;
        if (customerId) {
            try {
                const pastSubs = await stripe.subscriptions.list({
                    customer: customerId,
                    limit: 1,
                    status: 'all',
                });
                stripeHasPastSubs = (pastSubs.data.length > 0);
                console.log('🔍 Stripe past subscriptions check:', stripeHasPastSubs, 'count:', pastSubs.data.length);
            } catch (e) {
                console.error('⚠️ Failed to check Stripe past subs:', e.message);
            }
        }

        const shouldSkipTrial = dbHasUsedTrial || stripeHasPastSubs;
        console.log('Creating Stripe checkout session, dbHasUsedTrial:', dbHasUsedTrial, 'stripeHasPastSubs:', stripeHasPastSubs, 'shouldSkipTrial:', shouldSkipTrial);

        // Build subscription_data — only give trial to first-time users
        const subscriptionData: Record<string, unknown> = {
            metadata: { user_id: user.id },
        };
        if (!shouldSkipTrial) {
            subscriptionData.trial_period_days = 7;
            console.log('🆕 First-time user, adding 7-day trial');
        } else {
            console.log('🔄 Returning user, skipping trial — direct payment');
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.get('origin')}/pricing`,
            metadata: { user_id: user.id },
            subscription_data: subscriptionData,
        });

        console.log('✅ Session created:', session.id);

        return new Response(
            JSON.stringify({ sessionId: session.id, url: session.url }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error) {
        console.error('💥 Error:', error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});

console.log("🎯 Function ready to serve");
