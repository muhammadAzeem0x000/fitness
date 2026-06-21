import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useNutrition(userId, date = new Date().toISOString().split('T')[0]) {
    const queryClient = useQueryClient();

    // Fetch nutrition logs for a specific date
    const { data: nutritionLogs = [], isLoading } = useQuery({
        queryKey: ['nutrition', userId, date],
        queryFn: async () => {
            if (!userId) return [];
            const { data, error } = await supabase
                .from('nutrition_logs')
                .select('*')
                .eq('user_id', userId)
                .eq('date', date)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!userId,
    });

    // Add a new nutrition log
    const addNutritionLog = useMutation({
        mutationFn: async (logData) => {
            if (!userId) throw new Error('User not authenticated');
            const { data, error } = await supabase
                .from('nutrition_logs')
                .insert([{ user_id: userId, date, ...logData }])
                .select();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['nutrition', userId, date]);
        }
    });

    // Delete a nutrition log
    const deleteNutritionLog = useMutation({
        mutationFn: async (logId) => {
            const { error } = await supabase
                .from('nutrition_logs')
                .delete()
                .eq('id', logId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['nutrition', userId, date]);
        }
    });

    // Calculate daily totals
    const dailyTotals = nutritionLogs.reduce((acc, log) => ({
        calories: acc.calories + (log.calories || 0),
        protein: acc.protein + (log.protein || 0),
        carbs: acc.carbs + (log.carbs || 0),
        fats: acc.fats + (log.fats || 0),
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    return {
        nutritionLogs,
        dailyTotals,
        isLoading,
        addNutritionLog: addNutritionLog.mutateAsync,
        isAdding: addNutritionLog.isPending,
        deleteNutritionLog: deleteNutritionLog.mutateAsync,
        isDeleting: deleteNutritionLog.isPending
    };
}
