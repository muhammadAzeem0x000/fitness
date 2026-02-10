import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import Stripe from "npm:stripe@14"

console.log("✅ verify-session function initialized");

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    console.log("🚀 verify-session request received:", req.method);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Missing Authorization header' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            );
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) {
            console.error('❌ Auth error:', userError?.message);
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            );
        }

        console.log('👤 User:', user.email, 'ID:', user.id);

        const { sessionId } = await req.json();
        if (!sessionId) throw new Error('Session ID is required');

        console.log('🔍 Verifying checkout session:', sessionId);

        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not configured');
        const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

        // Retrieve checkout session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['subscription']
        });

        console.log('📋 Session status:', session.status, 'Payment:', session.payment_status);

        if (session.status !== 'complete') {
            return new Response(
                JSON.stringify({ error: 'Checkout not complete' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        const subscription = session.subscription;
        const subData = typeof subscription === 'string'
            ? await stripe.subscriptions.retrieve(subscription)
            : subscription;

        console.log('📋 Subscription:', subData?.id, 'Status:', subData?.status);

        // Get ALL subscription rows for this user (there may be duplicates)
        const { data: existingRows, error: fetchError } = await supabaseClient
            .from('subscriptions')
            .select('id, stripe_customer_id, stripe_subscription_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        console.log('📋 Existing rows:', existingRows?.length, fetchError?.message || 'OK');

        if (fetchError || !existingRows || existingRows.length === 0) {
            console.log('⚠️ No existing subscription row, inserting new one');
            const customerId = typeof session.customer === 'string' ? session.customer : null;
            const { error: insertError } = await supabaseClient
                .from('subscriptions')
                .insert({
                    user_id: user.id,
                    stripe_customer_id: customerId,
                    stripe_subscription_id: subData?.id || null,
                    status: subData?.status || 'active',
                    plan_id: subData?.items?.data?.[0]?.price?.id || null,
                    current_period_start: subData?.current_period_start
                        ? new Date(subData.current_period_start * 1000).toISOString() : null,
                    current_period_end: subData?.current_period_end
                        ? new Date(subData.current_period_end * 1000).toISOString() : null,
                    cancel_at_period_end: subData?.cancel_at_period_end || false,
                });
            if (insertError) throw new Error(`Insert failed: ${insertError.message}`);
        } else {
            // Update only the FIRST (most recent) row by its specific ID
            const targetRow = existingRows[0];
            console.log('📝 Updating row ID:', targetRow.id);

            // Build update data carefully - avoid UNIQUE constraint conflicts
            const updateData = {
                status: subData?.status || 'active',
                plan_id: subData?.items?.data?.[0]?.price?.id || null,
                current_period_start: subData?.current_period_start
                    ? new Date(subData.current_period_start * 1000).toISOString() : null,
                current_period_end: subData?.current_period_end
                    ? new Date(subData.current_period_end * 1000).toISOString() : null,
                cancel_at_period_end: subData?.cancel_at_period_end || false,
                updated_at: new Date().toISOString(),
            };

            // Only set stripe_subscription_id if no other row has it
            if (subData?.id) {
                const otherRowsWithSubId = existingRows.filter(
                    r => r.id !== targetRow.id && r.stripe_subscription_id === subData.id
                );
                if (otherRowsWithSubId.length === 0) {
                    updateData.stripe_subscription_id = subData.id;
                }
            }

            console.log('📝 Update data:', JSON.stringify(updateData));

            const { data: result, error: updateError } = await supabaseClient
                .from('subscriptions')
                .update(updateData)
                .eq('id', targetRow.id)
                .select();

            if (updateError) {
                console.error('❌ Update error:', JSON.stringify(updateError));
                throw new Error(`Update failed: ${updateError.message}`);
            }

            console.log('✅ Updated row:', JSON.stringify(result));
        }

        return new Response(
            JSON.stringify({ success: true, status: subData?.status }),
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
