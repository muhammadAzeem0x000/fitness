import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useWeight(userId) {
    const queryClient = useQueryClient();

    const { data: weightHistory = [], isLoading } = useQuery({
        queryKey: ['weightHistory', userId],
        queryFn: async () => {
            if (!userId) return [];
            const { data, error } = await supabase
                .from('weight_history')
                .select('*')
                .eq('user_id', userId)
                .order('date', { ascending: true });
            if (error) throw error;
            return data;
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false,
    });

    const addWeightEntryMutation = useMutation({
        mutationFn: async (weight) => {
            const today = new Date().toISOString().split('T')[0];
            const newWeight = parseFloat(weight);

            // 1. Add to history
            const { error: historyError } = await supabase
                .from('weight_history')
                .insert({ weight: newWeight, date: today, user_id: userId });
            if (historyError) throw historyError;

            // 2. Update profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ current_weight: newWeight, updated_at: new Date().toISOString() })
                .eq('id', userId);
            if (profileError) console.error(profileError); // Non-blocking
        },
        onMutate: async (newWeight) => {
            await queryClient.cancelQueries({ queryKey: ['weightHistory', userId] });
            await queryClient.cancelQueries({ queryKey: ['profile', userId] });

            const previousWeightHistory = queryClient.getQueryData(['weightHistory', userId]);
            const previousProfile = queryClient.getQueryData(['profile', userId]);

            queryClient.setQueryData(['weightHistory', userId], (old) => {
                const optimisticEntry = {
                    id: `temp-${Date.now()}`,
                    weight: parseFloat(newWeight),
                    date: new Date().toISOString().split('T')[0],
                    user_id: userId
                };
                return old ? [...old, optimisticEntry] : [optimisticEntry];
            });

            queryClient.setQueryData(['profile', userId], (old) => {
                if (!old) return old;
                return { ...old, current_weight: parseFloat(newWeight) };
            });

            return { previousWeightHistory, previousProfile };
        },
        onError: (err, newWeight, context) => {
            queryClient.setQueryData(['weightHistory', userId], context.previousWeightHistory);
            queryClient.setQueryData(['profile', userId], context.previousProfile);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['weightHistory', userId] });
            queryClient.invalidateQueries({ queryKey: ['profile', userId] });
        }
    });

    return {
        weightHistory,
        isLoading,
        addWeightEntry: addWeightEntryMutation.mutateAsync
    };
}
