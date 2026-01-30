import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useWorkouts(userId) {
    const queryClient = useQueryClient();

    // 1. Logs
    const { data: workoutLogs = [], isLoading: loadingLogs } = useQuery({
        queryKey: ['workoutLogs', userId],
        queryFn: async () => {
            if (!userId) return [];
            const { data, error } = await supabase
                .from('workout_logs')
                .select('*')
                .eq('user_id', userId)
                .order('date', { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!userId,
    });

    // 2. Routines
    const { data: routines = [], isLoading: loadingRoutines } = useQuery({
        queryKey: ['routines', userId],
        queryFn: async () => {
            if (!userId) return [];
            const { data, error } = await supabase
                .from('routines')
                .select('*')
                .eq('user_id', userId)
                .order('id', { ascending: true });
            if (error) throw error;
            return data;
        },
        enabled: !!userId,
    });

    // Mutation: Add Log
    const addWorkoutLogMutation = useMutation({
        mutationFn: async (workoutData) => {
            const { type, exercises, timestamp } = workoutData;
            const { error } = await supabase
                .from('workout_logs')
                .insert({
                    user_id: userId,
                    type,
                    exercises,
                    date: timestamp
                });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workoutLogs', userId] });
        }
    });

    return {
        workoutLogs,
        routines,
        isLoading: loadingLogs || loadingRoutines,
        addWorkoutLog: addWorkoutLogMutation.mutateAsync
    };
}
