import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useWorkouts(userId, type = null) {
    const queryClient = useQueryClient();

    // 1. Logs (All)
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

    // 3. Exercises (Global List)
    const { data: exercises = [], isLoading: loadingExercises } = useQuery({
        queryKey: ['exercises'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('exercises')
                .select('*')
                .order('name', { ascending: true });

            if (error) {
                console.warn("Could not fetch exercises, table might not exist.", error);
                return [];
            }
            return data;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    // 4. Last Workout by Type (Specific Category)
    const { data: lastWorkoutByType, isLoading: loadingLast } = useQuery({
        queryKey: ['lastWorkout', userId, type],
        queryFn: async () => {
            if (!userId || !type) return null;
            const { data, error } = await supabase
                .from('workout_logs')
                .select('*')
                .eq('user_id', userId)
                .eq('type', type)
                .order('date', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows
            return data;
        },
        enabled: !!userId && !!type,
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
            // Also invalidate last workout for this type
            if (type) {
                queryClient.invalidateQueries({ queryKey: ['lastWorkout', userId, type] });
            }
        }
    });

    return {
        workoutLogs,
        routines,
        exercises,
        lastWorkoutByType,
        isLoading: loadingLogs || loadingRoutines || loadingExercises || loadingLast,
        addWorkoutLog: addWorkoutLogMutation.mutateAsync
    };
}
