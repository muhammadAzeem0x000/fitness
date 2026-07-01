import React, { useState, useEffect } from 'react';
import { Sparkles, X, CheckCircle2, TrendingUp, Zap } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import { usePricing } from '../../context/PricingContext';

const MAX_TOTAL_DISPLAYS = 10;
const SESSION_INTERVAL = 3;

export function PremiumPromoPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const { isPremium, isTrialEligible, isLoading } = useSubscription();
    const { openPricing } = usePricing();

    useEffect(() => {
        if (isLoading || isPremium) return;

        const checkPromoEligibility = () => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const lastDate = localStorage.getItem('mb_promo_last_date');
                let sessionCount = parseInt(localStorage.getItem('mb_promo_session_count') || '0', 10);
                let displayCount = parseInt(localStorage.getItem('mb_promo_display_count') || '0', 10);

                let shouldShow = false;

                if (lastDate !== today) {
                    // First open of the day
                    shouldShow = true;
                    localStorage.setItem('mb_promo_last_date', today);
                    localStorage.setItem('mb_promo_session_count', '1');
                } else {
                    // Subsequent opens in the same day
                    sessionCount += 1;
                    localStorage.setItem('mb_promo_session_count', sessionCount.toString());
                    
                    if (sessionCount % SESSION_INTERVAL === 0 && displayCount < MAX_TOTAL_DISPLAYS) {
                        shouldShow = true;
                    }
                }

                if (shouldShow) {
                    setIsOpen(true);
                    localStorage.setItem('mb_promo_display_count', (displayCount + 1).toString());
                }
            } catch (error) {
                console.error('Error handling promo logic:', error);
            }
        };

        // Slight delay to not interrupt the initial app load animation
        const timer = setTimeout(() => {
            checkPromoEligibility();
        }, 1500);

        return () => clearTimeout(timer);
    }, [isPremium, isLoading]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header Graphic */}
                <div className="relative h-32 bg-gradient-to-br from-blue-600 to-emerald-500 p-6 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-black/10"></div>
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl transform -translate-x-1/2 translate-y-1/2"></div>
                    
                    <div className="relative z-10 bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-lg border border-white/30">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-3 right-3 p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors z-20 backdrop-blur-md"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                        Unlock Your Full Potential
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 text-center mb-6">
                        {isTrialEligible 
                            ? 'Start your 14-day free trial today to get the most out of your fitness journey.' 
                            : 'Upgrade to Premium and get the most out of your fitness journey.'}
                    </p>

                    <div className="space-y-4 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 bg-blue-100 dark:bg-blue-900/30 p-1 rounded-full text-blue-600 dark:text-blue-400">
                                <Zap className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200">AI Workout Coach</h4>
                                <p className="text-xs text-slate-500 dark:text-zinc-400">Personalized plans tailored for you.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 bg-emerald-100 dark:bg-emerald-900/30 p-1 rounded-full text-emerald-600 dark:text-emerald-400">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200">Advanced Analytics</h4>
                                <p className="text-xs text-slate-500 dark:text-zinc-400">Track progress with detailed charts.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 bg-purple-100 dark:bg-purple-900/30 p-1 rounded-full text-purple-600 dark:text-purple-400">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200">Unlimited Logging</h4>
                                <p className="text-xs text-slate-500 dark:text-zinc-400">No restrictions on your workout history.</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setIsOpen(false);
                            openPricing();
                        }}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {isTrialEligible ? 'Start 14-Day Free Trial' : 'View Premium Plans'}
                        <Sparkles className="w-4 h-4" />
                    </button>
                    
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full mt-3 py-2 text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
}
