import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// Initialize Stripe with your publishable key
let stripePromise = null;

export const getStripe = () => {
    if (!stripePromise) {
        const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
        if (!key) {
            console.error('Missing VITE_STRIPE_PUBLIC_KEY in environment variables');
            return null;
        }
        stripePromise = loadStripe(key);
    }
    return stripePromise;
};

/**
 * Create a Stripe checkout session and redirect to checkout
 * @param {string} priceId - Stripe price ID (e.g., 'price_pro_monthly')
 * @param {string} userId - Current user ID
 */
export async function createCheckoutSession(priceId, userId) {
    try {
        // Call your backend/edge function to create checkout session
        // This is a placeholder - you'll need to create the edge function
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
            body: { priceId, userId }
        });

        if (error) throw error;

        // Redirect to Stripe Checkout
        const stripe = await getStripe();
        if (!stripe) throw new Error('Stripe failed to initialize');

        const { error: stripeError } = await stripe.redirectToCheckout({
            sessionId: data.sessionId
        });

        if (stripeError) throw stripeError;
    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
    }
}

/**
 * Create a Stripe Customer Portal session for subscription management
 * @param {string} customerId - Stripe customer ID
 */
export async function createPortalSession(customerId) {
    try {
        const { data, error } = await supabase.functions.invoke('create-portal-session', {
            body: { customerId }
        });

        if (error) throw error;

        // Redirect to Customer Portal
        window.location.href = data.url;
    } catch (error) {
        console.error('Error creating portal session:', error);
        throw error;
    }
}

/**
 * Get subscription details for a user
 * @param {string} userId - User ID
 */
export async function getSubscription(userId) {
    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw error;
    }

    return data;
}

/**
 * Check if user has active premium subscription
 * @param {string} userId - User ID
 */
export async function isPremiumUser(userId) {
    const subscription = await getSubscription(userId);
    if (subscription?.status === 'active') return true;
    if (subscription?.status === 'trialing') {
        // Check if trial has actually expired
        if (subscription.current_period_end) {
            return new Date(subscription.current_period_end) > new Date();
        }
        return true; // No end date stored yet, assume still valid
    }
    return false;
}

/**
 * Pricing configuration
 */
export const PRICING_PLANS = {
    free: {
        name: 'Free',
        price: 0,
        interval: null,
        features: [
            'Basic workout logging',
            'Last 10 workouts only',
            '1 AI report per month',
            'Basic exercise library',
        ],
        limitations: [
            'No advanced charts',
            'No streak tracking',
            'No personal records',
            'Limited workout history',
        ]
    },
    pro_monthly: {
        name: 'Pro Monthly',
        price: 9.99,
        interval: 'month',
        priceId: 'price_XXXXX', // TODO: Replace with actual Stripe price ID
        features: [
            'Unlimited AI Coach reports',
            'Advanced progress charts',
            'Streak tracking & achievements',
            'Personal records tracking',
            'Muscle activation heatmap',
            'Unlimited workout history',
            'Custom routine builder',
            'Priority support',
        ],
        popular: true,
    },
    pro_yearly: {
        name: 'Pro Yearly',
        price: 89.99,
        interval: 'year',
        priceId: 'price_YYYYY', // TODO: Replace with actual Stripe price ID
        features: [
            'Everything in Pro Monthly',
            'Save 25% ($30/year)',
            'Annual billing',
        ],
        badge: 'Best Value',
    }
};
