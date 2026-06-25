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
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
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
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
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
        refetchOnWindowFocus: false,
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
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

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
        onMutate: async (newWorkout) => {
            await queryClient.cancelQueries({ queryKey: ['workoutLogs', userId] });
            const previousWorkouts = queryClient.getQueryData(['workoutLogs', userId]);

            queryClient.setQueryData(['workoutLogs', userId], (old) => {
                const optimisticWorkout = {
                    id: `temp-${Date.now()}`,
                    user_id: userId,
                    type: newWorkout.type,
                    exercises: newWorkout.exercises,
                    date: newWorkout.timestamp,
                    created_at: new Date().toISOString()
                };
                // Sort by date descending
                const newArray = old ? [optimisticWorkout, ...old] : [optimisticWorkout];
                return newArray.sort((a, b) => new Date(b.date) - new Date(a.date));
            });

            return { previousWorkouts };
        },
        onError: (err, newWorkout, context) => {
            queryClient.setQueryData(['workoutLogs', userId], context.previousWorkouts);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['workoutLogs', userId] });
            if (type) {
                queryClient.invalidateQueries({ queryKey: ['lastWorkout', userId, type] });
            }
        }
    });

    const addRoutineMutation = useMutation({
        mutationFn: async (routineData) => {
            const { name, exercises } = routineData;
            const { error } = await supabase
                .from('routines')
                .insert({
                    user_id: userId,
                    name,
                    exercises
                });
            if (error) throw error;
        },
        onMutate: async (newRoutine) => {
            await queryClient.cancelQueries({ queryKey: ['routines', userId] });
            const previousRoutines = queryClient.getQueryData(['routines', userId]);

            queryClient.setQueryData(['routines', userId], (old) => {
                const optimisticRoutine = {
                    id: `temp-${Date.now()}`,
                    user_id: userId,
                    name: newRoutine.name,
                    exercises: newRoutine.exercises,
                    created_at: new Date().toISOString()
                };
                return old ? [...old, optimisticRoutine] : [optimisticRoutine];
            });

            return { previousRoutines };
        },
        onError: (err, newRoutine, context) => {
            queryClient.setQueryData(['routines', userId], context.previousRoutines);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['routines', userId] });
        }
    });

    const deleteWorkoutLogMutation = useMutation({
        mutationFn: async (logId) => {
            const { error } = await supabase
                .from('workout_logs')
                .delete()
                .eq('id', logId);
            if (error) throw error;
        },
        onMutate: async (deletedId) => {
            await queryClient.cancelQueries({ queryKey: ['workoutLogs', userId] });
            const previousWorkouts = queryClient.getQueryData(['workoutLogs', userId]);

            queryClient.setQueryData(['workoutLogs', userId], (old) => {
                if (!old) return old;
                return old.filter(w => w.id !== deletedId);
            });

            return { previousWorkouts };
        },
        onError: (err, newRoutine, context) => {
            queryClient.setQueryData(['workoutLogs', userId], context.previousWorkouts);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['workoutLogs', userId] });
        }
    });

    return {
        workoutLogs,
        routines,
        exercises,
        lastWorkoutByType,
        isLoading: loadingLogs || loadingRoutines || loadingExercises || loadingLast,
        addWorkoutLog: addWorkoutLogMutation.mutateAsync,
        addRoutine: addRoutineMutation.mutateAsync,
        deleteWorkoutLog: deleteWorkoutLogMutation.mutateAsync
    };
}
