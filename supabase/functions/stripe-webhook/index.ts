import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@^2.0.0"
import Stripe from "npm:stripe@^14.0.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
    const signature = req.headers.get('Stripe-Signature')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!signature || !webhookSecret) {
        return new Response('Missing signature or webhook secret', { status: 400 })
    }

    try {
        const body = await req.text()

        // Verify webhook signature
        const event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret,
            undefined,
            cryptoProvider
        )

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log(`Webhook received: ${event.type}`)

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                const userId = session.metadata?.user_id

                if (!userId) {
                    console.error('No user_id in metadata')
                    break
                }

                // Update subscription record
                await supabaseAdmin
                    .from('subscriptions')
                    .update({
                        stripe_subscription_id: session.subscription as string,
                        status: 'trialing', // Will be 'trialing' initially due to trial period
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', userId)

                console.log(`Checkout completed for user ${userId}`)
                break
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription
                const userId = subscription.metadata.user_id

                if (!userId) {
                    console.error('No user_id in metadata')
                    break
                }

                // Update subscription status
                await supabaseAdmin
                    .from('subscriptions')
                    .update({
                        stripe_subscription_id: subscription.id,
                        status: subscription.status,
                        plan_id: subscription.items.data[0]?.price.id,
                        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        cancel_at_period_end: subscription.cancel_at_period_end,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', userId)

                console.log(`Subscription ${subscription.status} for user ${userId}`)
                break
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription
                const userId = subscription.metadata.user_id

                if (!userId) {
                    console.error('No user_id in metadata')
                    break
                }

                // Mark as canceled
                await supabaseAdmin
                    .from('subscriptions')
                    .update({
                        status: 'canceled',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', userId)

                console.log(`Subscription canceled for user ${userId}`)
                break
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice
                console.log(`Payment succeeded for invoice ${invoice.id}`)
                break
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice
                const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
                const userId = subscription.metadata.user_id

                if (userId) {
                    await supabaseAdmin
                        .from('subscriptions')
                        .update({
                            status: 'past_due',
                            updated_at: new Date().toISOString(),
                        })
                        .eq('user_id', userId)

                    console.log(`Payment failed for user ${userId}`)
                }
                break
            }

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('Webhook error:', error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
