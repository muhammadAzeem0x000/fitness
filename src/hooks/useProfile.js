import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useProfile(userId) {
    const queryClient = useQueryClient();

    const { data: profile, isLoading, error, fetchStatus } = useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
            if (!userId) return null;
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // Not found
                throw error;
            }
            return data;
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false,
    });

    const updateProfileMutation = useMutation({
        mutationFn: async (updates) => {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    ...updates,
                    updated_at: new Date().toISOString()
                });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', userId] });
        }
    });

    const updateHeightMutation = useMutation({
        mutationFn: async (heightCm) => {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    height: parseFloat(heightCm),
                    updated_at: new Date().toISOString()
                });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', userId] });
        }
    });

    return {
        profile,
        isLoading,
        error,
        fetchStatus,
        updateProfile: updateProfileMutation.mutateAsync,
        updateHeight: updateHeightMutation.mutateAsync
    };
}
