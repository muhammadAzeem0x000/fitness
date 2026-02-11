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
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
        refetchOnWindowFocus: false,
    });

    // Compute premium status
    const isPremium = subscription?.status === 'active' || subscription?.status === 'trialing';
    const isTrialing = subscription?.status === 'trialing';
    const isCanceled = subscription?.cancel_at_period_end === true;

    // Helper to invalidate cache (call after subscription changes)
    const refreshSubscription = () => {
        queryClient.invalidateQueries(['subscription', user?.id]);
    };

    return {
        subscription,
        isPremium,
        isTrialing,
        isCanceled,
        isLoading: authLoading || queryLoading,
        error,
        refreshSubscription,
    };
}
