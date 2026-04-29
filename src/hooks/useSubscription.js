import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

/**
 * Hook to manage user subscription status
 * Returns subscription data and premium status
 */
export function useSubscription() {
    const { user, loading: authLoading } = useAuth();
    const queryClient = useQueryClient();

    const { data: subscription, isLoading: queryLoading, error } = useQuery({
        queryKey: ['subscription', user?.id],
        queryFn: async () => {
            if (!user) return null;

            // Fetch user's subscription (use limit(1) instead of single() to avoid
            // errors when there are multiple rows from duplicate checkout attempts)
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(1);

            if (error) {
                throw error;
            }

            // If no subscription exists, user is on free tier
            if (!data || data.length === 0) {
                return {
                    status: 'inactive',
                    plan_id: 'free',
                    user_id: user.id
                };
            }

            return data[0];
        },
        enabled: !!user && !authLoading,
        staleTime: 1000 * 60 * 1, // Cache for 1 minute (reduced for faster trial expiry detection)
        refetchOnWindowFocus: true, // Re-check when user returns to the app
        refetchInterval: 1000 * 60 * 2, // Also poll every 2 minutes to catch trial expiry
    });

    // Check if the trial period has actually expired based on current_period_end
    const isTrialExpired = (() => {
        if (subscription?.status !== 'trialing') return false;
        if (!subscription?.current_period_end) return false;
        const periodEnd = new Date(subscription.current_period_end);
        return periodEnd < new Date();
    })();

    // Compute premium status — a trialing subscription is only premium if
    // the trial period hasn't expired yet
    const isPremium = (() => {
        if (subscription?.status === 'active') return true;
        if (subscription?.status === 'trialing' && !isTrialExpired) return true;
        return false;
    })();

    const isTrialing = subscription?.status === 'trialing' && !isTrialExpired;
    const isCanceled = subscription?.cancel_at_period_end === true;

    // Helper to invalidate cache (call after subscription changes)
    const refreshSubscription = () => {
        queryClient.invalidateQueries(['subscription', user?.id]);
    };

    return {
        subscription,
        isPremium,
        isTrialing,
        isTrialExpired,
        isCanceled,
        isLoading: authLoading || queryLoading,
        error,
        refreshSubscription,
    };
}
