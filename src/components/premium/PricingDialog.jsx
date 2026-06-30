import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check, Sparkles, Zap, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { getOfferings, purchasePackage, restorePurchases } from '../../lib/revenuecat';
import { isNativePlatform } from '../../lib/platform';
import { usePricing } from '../../context/PricingContext';
import { ElasticScroll } from '../ui/ElasticScroll';
import { useToast } from '../../context/ToastContext';
import { useSubscription } from '../../hooks/useSubscription';

export function PricingDialog({ isOpen, onClose }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const { refreshSubscription } = useSubscription();

    const [offerings, setOfferings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(null);
    const [restoring, setRestoring] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchOfferings();
        }
    }, [isOpen]);

    async function fetchOfferings() {
        if (!isNativePlatform()) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const fetchedOfferings = await getOfferings();
            if (fetchedOfferings && typeof fetchedOfferings === 'object') {
                if (fetchedOfferings.current) {
                    setOfferings(fetchedOfferings.current);
                    if (fetchedOfferings.current.availablePackages.length === 0) {
                        setError("Google Play is currently blocking the products for this testing environment.");
                    }
                } else {
                    setError("No current offerings available.");
                }
            } else {
                setError("Unable to fetch premium plans at this time.");
            }
        } catch (err) {
            console.error("Error fetching offerings:", err);
            setError(err?.message || "Failed to load pricing plans");
        } finally {
            setLoading(false);
        }
    }

    const handlePurchase = async (pkg) => {
        if (!user) {
            onClose();
            // In a real scenario we'd navigate to auth, but usually this is protected.
            return;
        }

        try {
            setPurchasing(pkg.identifier);
            setError(null);
            const customerInfo = await purchasePackage(pkg);
            if (customerInfo?.entitlements.active['MuscleBot Pro']) {
                toast.success("Welcome to MuscleBot Pro!");
                await refreshSubscription();
                onClose();
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
            setRestoring(true);
            const customerInfo = await restorePurchases();
            if (customerInfo?.entitlements.active['MuscleBot Pro']) {
                toast.success("Purchases restored successfully!");
                await refreshSubscription();
                onClose();
            } else {
                toast.error("No active subscriptions found to restore.");
            }
        } catch (err) {
            console.error('Restore error:', err);
            setError(err.message || 'Failed to restore purchases');
        } finally {
            setRestoring(false);
        }
    };

    if (!isOpen) return null;

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    const modalVariants = {
        hidden: { y: '100%', opacity: 0 },
        visible: { 
            y: 0, 
            opacity: 1,
            transition: { type: "spring", damping: 25, stiffness: 300 }
        },
        exit: { 
            y: '100%', 
            opacity: 0,
            transition: { type: "spring", damping: 25, stiffness: 300 }
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 h-[100dvh]">
                    {/* Backdrop */}
                    <motion.div 
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div 
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 1 }}
                        onDragEnd={(e, info) => {
                            if (info.offset.y > 100 || info.velocity.y > 500) {
                                onClose();
                            }
                        }}
                        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"
                    >
                        {/* Drag Handle for Mobile */}
                        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden absolute top-0 left-0 z-20">
                            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                        </div>

                        {/* Elegant Header Background */}
                        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-500/10 via-purple-500/5 to-transparent dark:from-blue-500/20 dark:via-purple-500/5 dark:to-transparent opacity-80 z-0 pointer-events-none"></div>
                        
                        {/* Header Content */}
                        <div className="relative z-10 pt-10 pb-6 px-6 text-center shrink-0">
                            <button 
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full bg-slate-100/50 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors backdrop-blur-md hidden sm:block"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            
                            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 transform rotate-3">
                                <Sparkles className="w-6 h-6 text-white transform -rotate-3" />
                            </div>
                            
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                Unlock MuscleBot Pro
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-[280px] sm:max-w-sm mx-auto leading-relaxed pb-2">
                                Get AI-powered coaching, advanced analytics, and unlimited workouts.
                            </p>
                        </div>

                        {/* Scrollable Body */}
                        <ElasticScroll className="relative z-10 px-6 pb-6 flex-1 custom-scrollbar">
                            
                            {error && (
                                <div className="mb-6 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 flex items-start gap-3 text-sm">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <p>{error}</p>
                                </div>
                            )}

                            {!isNativePlatform() ? (
                                <div className="text-center py-8 bg-blue-50/50 dark:bg-slate-800/50 rounded-2xl border border-blue-100 dark:border-slate-700">
                                    <Sparkles className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Web Version is Free</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 px-4">
                                        Premium features are currently free on the web. Support development by subscribing in the mobile app!
                                    </p>
                                </div>
                            ) : loading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading plans...</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {offerings?.availablePackages.map((pkg) => {
                                        const isAnnual = pkg.packageType === 'ANNUAL';
                                        
                                        return (
                                            <div 
                                                key={pkg.identifier} 
                                                className={`relative rounded-2xl p-5 sm:p-6 transition-all duration-300 ${
                                                    isAnnual 
                                                        ? 'bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-800 dark:to-indigo-900/20 border-2 border-blue-500/50 dark:border-blue-500 shadow-lg shadow-blue-500/10' 
                                                        : 'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'
                                                }`}
                                            >
                                                {isAnnual && (
                                                    <div className="absolute -top-3 left-6">
                                                        <div className="px-3 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-bold shadow-md uppercase tracking-wider">
                                                            Best Value
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                                    <div>
                                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{pkg.product.title}</h3>
                                                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{pkg.product.description}</p>
                                                    </div>
                                                    <div className="text-left sm:text-right">
                                                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{pkg.product.priceString}</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mb-5">
                                                    <FeatureItem text="Unlimited AI Coach" />
                                                    <FeatureItem text="Advanced progress charts" />
                                                    <FeatureItem text="Streak tracking" />
                                                    <FeatureItem text="Priority support" />
                                                </div>

                                                <Button
                                                    onClick={() => handlePurchase(pkg)}
                                                    disabled={!!purchasing}
                                                    className={`w-full py-6 rounded-xl font-bold text-[15px] ${
                                                        isAnnual 
                                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md' 
                                                            : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white'
                                                    }`}
                                                >
                                                    {purchasing === pkg.identifier ? (
                                                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                                    ) : (
                                                        'Subscribe Now'
                                                    )}
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Restore Purchases - Subtle Link */}
                            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                                <button 
                                    onClick={handleRestore}
                                    disabled={restoring}
                                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors inline-flex items-center gap-1.5"
                                >
                                    {restoring ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                    Already bought? Restore Purchases
                                </button>
                                <p className="text-[10px] text-slate-400 mt-3 max-w-[280px] mx-auto leading-relaxed">
                                    Recurring billing, cancel anytime. By subscribing you agree to our Terms of Service and Privacy Policy.
                                </p>
                            </div>
                        </ElasticScroll>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

function FeatureItem({ text }) {
    return (
        <div className="flex items-center gap-2">
            <div className="bg-blue-100 dark:bg-blue-500/20 p-0.5 rounded-full">
                <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-300">{text}</span>
        </div>
    );
}
