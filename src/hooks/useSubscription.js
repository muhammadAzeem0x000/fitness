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
            const hasPro = await checkEntitlement();
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
