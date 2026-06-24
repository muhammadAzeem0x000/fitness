import React from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { Button } from '../ui/Button';
import { Lock, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Premium Gate Component
 * Wraps premium features and shows upgrade prompt for free users
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Premium content to show if user has access
 * @param {string} props.feature - Feature name for messaging (e.g., "AI Coach reports")
 * @param {React.ReactNode} props.fallback - Custom fallback UI (optional)
 * @param {boolean} props.showPreview - Show blurred preview of premium content
 */
export function PremiumGate({
    children,
    feature = "this premium feature",
    fallback,
    showPreview = false
}) {
    const { isPremium, isLoading, subscription, isTrialExpired } = useSubscription();
    const navigate = useNavigate();

    const hasUsedTrial = isTrialExpired ||
        subscription?.status === 'canceled' ||
        subscription?.status === 'past_due' ||
        subscription?.status === 'active' ||
        !!subscription?.stripe_subscription_id;

    // Show loading state
    if (isLoading) {
        return (
            <div className="animate-pulse bg-zinc-900/50 rounded-xl border border-zinc-800 h-64" />
        );
    }

    // User has premium access - show content
    if (isPremium) {
        return <>{children}</>;
    }

    // User needs to upgrade - show gate
    if (fallback) {
        return <>{fallback}</>;
    }

    // Default upgrade prompt
    return (
        <div className="relative">
            {/* Blurred preview (optional) */}
            {showPreview && (
                <div className="absolute inset-0 z-0 blur-md opacity-30 pointer-events-none overflow-hidden">
                    {children}
                </div>
            )}

            {/* Upgrade prompt overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center p-8 md:p-12 border-2 border-dashed border-zinc-800 rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-blue-900/10 backdrop-blur-sm min-h-[320px]">
                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/10">
                    <Lock className="w-8 h-8 text-blue-400" />
                </div>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 text-center">
                    Premium Feature
                </h3>

                {/* Description */}
                <p className="text-zinc-400 mb-6 text-center max-w-md text-sm md:text-base">
                    Unlock <span className="text-blue-400 font-medium">{feature}</span> with MuscleBot Pro
                </p>

                {/* Features list */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 mb-6 w-full max-w-sm">
                    <div className="text-xs text-zinc-500 uppercase tracking-wide mb-2 font-semibold">
                        Pro includes
                    </div>
                    <ul className="space-y-2 text-sm text-zinc-300">
                        <li className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-blue-400" />
                            Unlimited AI Coach reports
                        </li>
                        <li className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-blue-400" />
                            Advanced progress charts
                        </li>
                        <li className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-blue-400" />
                            Streak tracking & PRs
                        </li>
                    </ul>
                </div>

                <Button
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5"
                    onClick={() => navigate('/pricing')}
                >
                    <Sparkles className="w-5 h-5" />
                    {hasUsedTrial ? 'Upgrade to Pro - $4.99/mo' : 'Start 14-Day Free Trial'}
                </Button>

                {/* Subtext */}
                <p className="text-xs text-zinc-600 mt-4">
                    {hasUsedTrial ? '$4.99/mo • Cancel anytime' : '14-day free trial • Cancel anytime'}
                </p>
            </div>
        </div>
    );
}

/**
 * Inline Premium Badge
 * Shows a small "Pro" badge next to feature names
 */
export function PremiumBadge({ className = "" }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-xs font-semibold text-blue-400 ${className}`}>
            <Sparkles className="w-3 h-3" />
            PRO
        </span>
    );
}

/**Pricing issues fixed and commiting for deployment */