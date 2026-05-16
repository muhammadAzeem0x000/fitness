import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Check, Sparkles, Zap, TrendingUp, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';
import { getStripe } from '../lib/stripe';

export function Pricing() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { subscription, isPremium, isTrialExpired, isTrialing, isLoading: subLoading } = useSubscription();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Determine if user has already used a trial (expired trial, or any non-inactive/non-free subscription)
    const hasUsedTrial = isTrialExpired ||
        subscription?.status === 'canceled' ||
        subscription?.status === 'past_due' ||
        subscription?.status === 'active' ||
        !!subscription?.stripe_subscription_id;

    const handleSubscribe = async (priceId) => {
        if (!user) {
            navigate('/auth');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('🔵 Starting checkout with priceId:', priceId);
            console.log('🔵 User:', user.email);

            // Force refresh the session to get a valid access token
            // getSession() can return stale/expired tokens from cache
            const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
            if (sessionError || !session?.access_token) {
                console.error('Session refresh failed:', sessionError);
                throw new Error('Session expired. Please log in again.');
            }
            console.log('🔵 Session refreshed, token valid until:', new Date(session.expires_at * 1000).toLocaleString());

            console.log('🔵 Making direct fetch to edge function...');

            // Use direct fetch instead of SDK
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
                    },
                    body: JSON.stringify({ priceId })
                }
            );

            console.log('🔵 Response status:', response.status);

            const data = await response.json();
            console.log('🔵 Response data:', data);

            const error = response.ok ? null : data;

            if (error) {
                console.error('❌ Edge function error:', error);
                throw new Error(`Edge function failed: ${JSON.stringify(error)}`);
            }

            if (!data?.url) {
                console.error('❌ No checkout URL in response:', data);
                throw new Error('No checkout URL returned');
            }

            console.log('🔵 Got checkout URL, redirecting to Stripe...');

            // Use direct redirect instead of deprecated stripe.redirectToCheckout
            window.location.href = data.url;
        } catch (err) {
            console.error('💥 Checkout error:', err);
            setError(err.message || 'Failed to start checkout');
        } finally {
            setLoading(false);
        }
    };

    // For premium users wanting to switch plans, open the Stripe Portal instead
    const handleManagePlan = async () => {
        if (!subscription?.stripe_customer_id) {
            setError('No subscription found. Please contact support.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.functions.invoke('create-portal-session', {
                body: { customerId: subscription.stripe_customer_id }
            });

            if (error) throw error;

            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error('💥 Portal error:', err);
            setError(err.message || 'Failed to open subscription management');
        } finally {
            setLoading(false);
        }
    };

    // Route to the right action based on subscription state
    const handlePlanAction = (plan) => {
        if (!plan.priceId) {
            if (!plan.disabled) {
                setError('Configuration error: missing price ID. Please contact support.');
            }
            return;
        }

        if (isPremium && !isProDisabled(plan.interval)) {
            // Premium user clicking "Switch Plan" — go to portal
            handleManagePlan();
        } else {
            // New/returning user — go to checkout
            handleSubscribe(plan.priceId);
        }
    };

    // Actual price IDs for comparison
    const monthlyPriceId = import.meta.env.VITE_STRIPE_PRICE_MONTHLY;
    const yearlyPriceId = import.meta.env.VITE_STRIPE_PRICE_YEARLY;

    // Determine CTA labels and states based on subscription status
    const getProCta = (planInterval) => {
        if (isPremium && isTrialing) return 'Currently Trialing';
        if (isPremium) {
            // Check if this is the current plan by comparing actual price IDs
            const isCurrentPlan = planInterval === 'month'
                ? subscription?.plan_id === monthlyPriceId
                : subscription?.plan_id === yearlyPriceId;
            return isCurrentPlan ? 'Current Plan' : 'Switch Plan';
        }
        if (hasUsedTrial) return 'Subscribe Now';
        return 'Start Free Trial';
    };

    const isProDisabled = (planInterval) => {
        if (isPremium) {
            const isCurrentPlan = planInterval === 'month'
                ? subscription?.plan_id === monthlyPriceId
                : subscription?.plan_id === yearlyPriceId;
            return isCurrentPlan; // Disable only if it's their current plan
        }
        return false;
    };

    const plans = [
        {
            name: 'Free',
            price: 0,
            description: 'Perfect for getting started',
            features: [
                'Basic workout logging',
                'Last 10 workouts only',
                '1 free AI report per month',
                'Basic exercise library',
                'Weight tracking',
            ],
            limitations: [
                'No advanced charts',
                'No streak tracking',
                'No personal records',
                'Limited workout history',
            ],
            cta: 'Current Plan',
            disabled: true,
        },
        {
            name: 'Pro Monthly',
            price: 9.99,
            priceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY,
            description: 'Full access to SmartFit',
            interval: 'month',
            popular: true,
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
            cta: getProCta('month'),
            disabled: isProDisabled('month'),
            badge: 'Most Popular',
        },
        {
            name: 'Pro Yearly',
            price: 89.99,
            priceId: import.meta.env.VITE_STRIPE_PRICE_YEARLY,
            description: 'Best value - Save 25%',
            interval: 'year',
            savings: '$30',
            features: [
                'Everything in Pro Monthly',
                'Save $30 per year (25% off)',
                'Annual billing',
                'Best value option',
            ],
            cta: getProCta('year'),
            disabled: isProDisabled('year'),
            badge: 'Best Value',
        },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <div className="border-b border-zinc-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <button onClick={() => navigate('/dashboard')} className="text-zinc-400 hover:text-white">
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Header Section */}
                <div className="text-center mb-16">
                    {/* Show trial expired banner if applicable */}
                    {isTrialExpired && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-6">
                            <AlertTriangle className="w-4 h-4" />
                            Your free trial has ended — Subscribe to continue using Pro features
                        </div>
                    )}

                    {/* Show free trial banner only for users who haven't used a trial yet */}
                    {!hasUsedTrial && !isPremium && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            7-Day Free Trial • No Credit Card Required Upfront
                        </div>
                    )}

                    {/* Show active trial banner if currently trialing */}
                    {isTrialing && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            You're on a free trial — Ends {new Date(subscription?.current_period_end).toLocaleDateString()}
                        </div>
                    )}

                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Fitness Plan</span>
                    </h1>

                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        {isTrialExpired
                            ? 'Your trial is over — pick a plan to keep unlocking your full potential'
                            : hasUsedTrial
                                ? 'Subscribe to unlock AI-powered coaching and advanced analytics'
                                : 'Start free and upgrade anytime to unlock AI-powered coaching and advanced analytics'
                        }
                    </p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    {plans.map((plan, index) => (
                        <div
                            key={plan.name}
                            className={`relative rounded-2xl p-8 ${plan.popular
                                ? 'bg-gradient-to-b from-blue-900/20 to-slate-900 border-2 border-blue-500/50 shadow-2xl shadow-blue-500/20'
                                : 'bg-slate-900 border border-zinc-800'
                                }`}
                        >
                            {/* Badge */}
                            {plan.badge && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <div className="px-4 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold shadow-lg">
                                        {plan.badge}
                                    </div>
                                </div>
                            )}

                            {/* Plan Header */}
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                <p className="text-zinc-400 text-sm mb-4">{plan.description}</p>

                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold">${plan.price}</span>
                                    {plan.interval && (
                                        <span className="text-zinc-400">/{plan.interval}</span>
                                    )}
                                </div>

                                {plan.savings && (
                                    <div className="mt-2 text-green-400 text-sm font-medium">
                                        Save {plan.savings} per year
                                    </div>
                                )}
                            </div>

                            {/* Features */}
                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3 text-sm">
                                        <Check className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                        <span className="text-zinc-300">{feature}</span>
                                    </li>
                                ))}

                                {plan.limitations?.map((limitation) => (
                                    <li key={limitation} className="flex items-start gap-3 text-sm opacity-50">
                                        <Lock className="w-5 h-5 text-zinc-600 shrink-0 mt-0.5" />
                                        <span className="text-zinc-500 line-through">{limitation}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <Button
                                onClick={() => handlePlanAction(plan)}
                                disabled={plan.disabled || loading || subLoading}
                                className={`w-full ${plan.disabled
                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white'
                                    }`}
                                size="lg"
                            >
                                {loading ? 'Loading...' : plan.cta}
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Feature Comparison */}
                <div className="bg-slate-900 border border-zinc-800 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold mb-8 text-center">What You Get with Pro</h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Zap className="w-8 h-8 text-blue-400" />
                            </div>
                            <h3 className="font-bold mb-2">AI-Powered Insights</h3>
                            <p className="text-sm text-zinc-400">
                                Get personalized coaching reports analyzing your progress, volume, and recovery
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <TrendingUp className="w-8 h-8 text-purple-400" />
                            </div>
                            <h3 className="font-bold mb-2">Advanced Analytics</h3>
                            <p className="text-sm text-zinc-400">
                                Track strength gains, volume load, and body weight trends with interactive charts
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-green-400" />
                            </div>
                            <h3 className="font-bold mb-2">Unlimited Everything</h3>
                            <p className="text-sm text-zinc-400">
                                No limits on workouts, routines, or AI reports. Track your entire fitness journey
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ or Testimonials could go here */}
            </div>
        </div>
    );
}
