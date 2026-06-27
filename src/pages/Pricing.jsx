import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Check, Sparkles, Zap, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getOfferings, purchasePackage, restorePurchases } from '../lib/revenuecat';
import { isNativePlatform } from '../lib/platform';
import { useToast } from '../context/ToastContext';

export function Pricing() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [offerings, setOfferings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchOfferings() {
            if (!isNativePlatform()) {
                setLoading(false);
                return;
            }
            try {
                const fetchedOfferings = await getOfferings();
                if (fetchedOfferings?.current) {
                    setOfferings(fetchedOfferings.current);
                } else {
                    setError("No packages available at this time.");
                }
            } catch (err) {
                console.error("Error fetching offerings:", err);
                setError("Failed to load subscription plans.");
            } finally {
                setLoading(false);
            }
        }
        fetchOfferings();
    }, []);

    const handlePurchase = async (pkg) => {
        if (!user) {
            navigate('/auth');
            return;
        }

        try {
            setPurchasing(pkg.identifier);
            setError(null);

            const customerInfo = await purchasePackage(pkg);
            if (customerInfo?.entitlements.active['MuscleBot Pro']) {
                toast.success("Welcome to MuscleBot Pro!");
                navigate('/dashboard');
            }
        } catch (err) {
            if (!err.userCancelled) {
                console.error('Purchase error:', err);
                setError(err.message || 'Purchase failed');
            }
        } finally {
            setPurchasing(null);
        }
    };

    const handleRestore = async () => {
        try {
            setLoading(true);
            const customerInfo = await restorePurchases();
            if (customerInfo?.entitlements.active['MuscleBot Pro']) {
                toast.success("Purchases restored successfully!");
                navigate('/dashboard');
            } else {
                toast.error("No active subscriptions found to restore.");
            }
        } catch (err) {
            console.error('Restore error:', err);
            setError(err.message || 'Failed to restore purchases');
        } finally {
            setLoading(false);
        }
    };

    // Render Web Fallback
    if (!isNativePlatform()) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
                <div className="max-w-md text-center">
                    <Sparkles className="w-16 h-16 text-blue-400 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold mb-4">MuscleBot Pro</h1>
                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        All premium features are currently free on the web version.
                        To manage subscriptions or support development, please use our mobile app.
                    </p>
                    <Button onClick={() => navigate('/dashboard')} size="lg" className="w-full">
                        Go to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
            <div className="border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <button onClick={() => navigate('/dashboard')} className="text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                            ← Back to Dashboard
                        </button>
                        <button onClick={handleRestore} className="text-sm font-medium text-blue-400 hover:text-blue-300">
                            Restore Purchases
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
                        Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500">Your Potential</span>
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto">
                        Get AI-powered coaching, advanced analytics, and unlimited workouts.
                    </p>
                </div>

                {error && (
                    <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                        <p className="text-slate-500 dark:text-zinc-400 font-medium">Loading plans...</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto justify-center">
                        {offerings?.availablePackages.map((pkg) => {
                            const isLifetime = pkg.packageType === 'LIFETIME';
                            const isAnnual = pkg.packageType === 'ANNUAL';

                            return (
                                <div key={pkg.identifier} className={`relative rounded-2xl p-6 ${isAnnual ? 'bg-gradient-to-b from-blue-50 dark:from-blue-900/20 to-white dark:to-slate-900 border-2 border-blue-500 shadow-xl shadow-blue-500/10 md:scale-105 z-10' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-zinc-800'}`}>
                                    {isAnnual && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[10px] font-bold shadow-lg uppercase tracking-wider">
                                                Best Value
                                            </div>
                                        </div>
                                    )}
                                    {isLifetime && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold shadow-lg uppercase tracking-wider">
                                                One-Time
                                            </div>
                                        </div>
                                    )}

                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold mb-1 text-slate-900 dark:text-white">{pkg.product.title}</h3>
                                        <p className="text-slate-500 dark:text-zinc-400 text-xs h-10">{pkg.product.description}</p>
                                        <div className="flex items-baseline gap-1 mt-4 text-slate-900 dark:text-white">
                                            <span className="text-3xl font-bold">{pkg.product.priceString}</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-3 mb-8">
                                        <li className="flex items-start gap-2 text-sm">
                                            <Check className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                                            <span className="text-slate-700 dark:text-zinc-300">Unlimited AI Coach reports</span>
                                        </li>
                                        <li className="flex items-start gap-2 text-sm">
                                            <Check className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                                            <span className="text-slate-700 dark:text-zinc-300">Advanced progress charts</span>
                                        </li>
                                        <li className="flex items-start gap-2 text-sm">
                                            <Check className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                                            <span className="text-slate-700 dark:text-zinc-300">Streak tracking & achievements</span>
                                        </li>
                                    </ul>

                                    <Button
                                        onClick={() => handlePurchase(pkg)}
                                        disabled={!!purchasing}
                                        className={`w-full ${isAnnual ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 dark:hover:from-blue-500 dark:hover:to-blue-400 text-white' : 'bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white'}`}
                                    >
                                        {purchasing === pkg.identifier ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Subscribe Now'}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Feature Comparison */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 max-w-4xl mx-auto mb-12 shadow-sm">
                    <h2 className="text-2xl font-bold mb-8 text-center text-slate-900 dark:text-white">What You Get with Pro</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
                                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="font-bold mb-2 text-slate-900 dark:text-white">AI-Powered Insights</h3>
                            <p className="text-sm text-slate-600 dark:text-zinc-400">Personalized coaching reports analyzing your progress.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="font-bold mb-2 text-slate-900 dark:text-white">Advanced Analytics</h3>
                            <p className="text-sm text-slate-600 dark:text-zinc-400">Track strength gains, volume load, and body weight trends.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-green-500/10 flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-emerald-600 dark:text-green-400" />
                            </div>
                            <h3 className="font-bold mb-2 text-slate-900 dark:text-white">Unlimited Everything</h3>
                            <p className="text-sm text-slate-600 dark:text-zinc-400">No limits on workouts, routines, or AI reports.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}