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

    // Fetch weekly logs for averages
    const { data: weeklyAverages = { calories: 0, protein: 0, carbs: 0, fats: 0 } } = useQuery({
        queryKey: ['nutrition_weekly', userId, date],
        queryFn: async () => {
            if (!userId) return { calories: 0, protein: 0, carbs: 0, fats: 0 };
            
            const endDate = new Date(date);
            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 7);
            const startDateStr = startDate.toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('nutrition_logs')
                .select('date, calories, protein, carbs, fats')
                .eq('user_id', userId)
                .gte('date', startDateStr)
                .lte('date', date);

            if (error) throw error;
            
            if (!data || data.length === 0) return { calories: 0, protein: 0, carbs: 0, fats: 0 };

            const totals = data.reduce((acc, log) => ({
                calories: acc.calories + (log.calories || 0),
                protein: acc.protein + (log.protein || 0),
                carbs: acc.carbs + (log.carbs || 0),
                fats: acc.fats + (log.fats || 0),
            }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

            // Divide by 7 for 7-day average
            return {
                calories: Math.round(totals.calories / 7),
                protein: Math.round(totals.protein / 7),
                carbs: Math.round(totals.carbs / 7),
                fats: Math.round(totals.fats / 7),
            };
        },
        enabled: !!userId,
    });

    // Fetch frequent foods for Quick Add
    const { data: frequentFoods = [] } = useQuery({
        queryKey: ['nutrition_frequent', userId],
        queryFn: async () => {
            if (!userId) return [];
            
            // Look back 30 days
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            const startDateStr = startDate.toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('nutrition_logs')
                .select('food_text, calories, protein, carbs, fats')
                .eq('user_id', userId)
                .gte('date', startDateStr);

            if (error) throw error;
            if (!data || data.length === 0) return [];

            const foodCounts = {};
            data.forEach(log => {
                if (!log.food_text) return;
                const name = log.food_text.trim();
                if (!foodCounts[name]) {
                    foodCounts[name] = { count: 0, ...log };
                }
                foodCounts[name].count++;
            });

            return Object.values(foodCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, 8); // Top 8
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
            queryClient.invalidateQueries({ queryKey: ['nutrition', userId, date] });
            queryClient.invalidateQueries({ queryKey: ['nutrition_weekly', userId, date] });
            queryClient.invalidateQueries({ queryKey: ['nutrition_frequent', userId] });
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
            queryClient.invalidateQueries({ queryKey: ['nutrition', userId, date] });
            queryClient.invalidateQueries({ queryKey: ['nutrition_weekly', userId, date] });
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
        weeklyAverages,
        frequentFoods,
        dailyTotals,
        isLoading,
        addNutritionLog: addNutritionLog.mutateAsync,
        isAdding: addNutritionLog.isPending,
        deleteNutritionLog: deleteNutritionLog.mutateAsync,
        isDeleting: deleteNutritionLog.isPending
    };
}
