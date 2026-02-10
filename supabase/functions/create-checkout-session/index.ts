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

        // Check for existing customer
        const { data: subscription } = await supabaseAdmin
            .from('subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);

        let customerId = subscription?.[0]?.stripe_customer_id;

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

        console.log('Creating Stripe checkout session');

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.get('origin')}/pricing`,
            metadata: { user_id: user.id },
            subscription_data: {
                metadata: { user_id: user.id },
                trial_period_days: 7,
            },
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
