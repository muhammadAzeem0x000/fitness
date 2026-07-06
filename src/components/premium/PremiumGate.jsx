import React from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { Button } from '../ui/Button';
import { Lock, Sparkles, MessageCircle, Utensils, Activity, LineChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePricing } from '../../context/PricingContext';

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
    const { isPremium, isTrialEligible, isLoading, subscription, isTrialExpired } = useSubscription();
    const { openPricing } = usePricing();
    const navigate = useNavigate();

    // User is premium, allow access to premium content
    if (isPremium) {
        return <>{children}</>;
    }

    // While loading subscription state, show a generic loading or nothing
    // This prevents flashing the 'Unlock Premium' gate before the state is known
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-white/50 dark:bg-zinc-900/50 min-h-[320px] animate-pulse">
                <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-zinc-800 mb-6"></div>
                <div className="h-6 w-48 bg-slate-200 dark:bg-zinc-800 rounded-md mb-2"></div>
                <div className="h-4 w-64 bg-slate-200 dark:bg-zinc-800 rounded-md"></div>
            </div>
        );
    }

    // User needs to upgrade - show gate
    if (fallback) {
        return <>{fallback}</>;
    }

    // Default upgrade prompt
    return (
        <div className="relative overflow-hidden rounded-2xl">
            {/* Blurred preview (optional) */}
            {showPreview && (
                <div className="absolute inset-0 z-0 blur-md opacity-30 pointer-events-none overflow-hidden select-none">
                    {children}
                </div>
            )}

            {/* Upgrade prompt overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center p-6 sm:p-8 md:p-12 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md min-h-[320px] shadow-xl">
                {/* Decorative background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

                {/* Icon */}
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                    <Lock className="w-8 h-8 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                    Unlock Premium
                </h3>

                {/* Description */}
                <p className="text-slate-500 dark:text-zinc-400 mb-8 text-center max-w-md text-sm md:text-base px-2">
                    Get access to <span className="text-blue-600 dark:text-blue-400 font-semibold">{feature}</span> and take your fitness journey to the next level with MuscleBot Pro.
                </p>

                {/* Features list */}
                <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-700/50 rounded-xl p-5 mb-8 w-full max-w-sm">
                    <div className="text-xs text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-4 font-bold text-center">
                        Pro Includes
                    </div>
                    <ul className="space-y-4 text-sm text-slate-700 dark:text-zinc-300">
                        <li className="flex items-center gap-3">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                                <MessageCircle className="w-4 h-4" />
                            </div>
                            <span className="font-medium leading-snug">Unlimited personalized AI coach chat</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0">
                                <Utensils className="w-4 h-4" />
                            </div>
                            <span className="font-medium leading-snug">AI meal planner</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <div className="bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded-lg text-purple-600 dark:text-purple-400 shrink-0">
                                <Activity className="w-4 h-4" />
                            </div>
                            <span className="font-medium leading-snug">Advanced readiness & analytics</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <div className="bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-lg text-amber-600 dark:text-amber-400 shrink-0">
                                <LineChart className="w-4 h-4" />
                            </div>
                            <span className="font-medium leading-snug">Weekly & monthly progress reports</span>
                        </li>
                    </ul>
                </div>

                <Button
                    size="lg"
                    className="w-full max-w-sm h-12 text-base gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5 border-0 rounded-xl"
                    onClick={() => openPricing()}
                >
                    <Sparkles className="w-5 h-5" />
                    {isTrialEligible ? 'Start 14-Day Free Trial' : 'Upgrade to Pro'}
                </Button>

                {/* Subtext */}
                <p className="text-xs font-medium text-slate-400 dark:text-zinc-500 mt-4">
                    {isTrialEligible ? '14-day free trial • Cancel anytime' : 'Cancel anytime'}
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
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 border border-blue-500/20 dark:border-blue-500/30 text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wide uppercase ${className}`}>
            <Sparkles className="w-3 h-3" />
            PRO
        </span>
    );
}