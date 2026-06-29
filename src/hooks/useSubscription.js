import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { checkEntitlement } from '../lib/revenuecat';

/**
 * Hook to manage user subscription status
 * Returns subscription data and premium status
 */
export function useSubscription() {
    const { user, loading: authLoading } = useAuth();
    const [isPremium, setIsPremium] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const refreshSubscription = async () => {
        try {
            // Race the entitlement check against a 5-second timeout
            // This prevents the app from hanging if RevenueCat fails to initialize or respond
            const hasPro = await Promise.race([
                checkEntitlement(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('RevenueCat timeout')), 5000))
            ]);
            setIsPremium(hasPro);
        } catch (error) {
            console.error('Failed to check RevenueCat entitlement', error);
            setIsPremium(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            refreshSubscription();
        }
    }, [authLoading, user]);

    return {
        subscription: null,
        isPremium,
        isTrialing: false,
        isTrialExpired: false,
        isCanceled: false,
        isLoading: authLoading || isLoading,
        error: null,
        refreshSubscription,
    };
}
