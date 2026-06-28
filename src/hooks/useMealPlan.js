import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useMealPlan(userId, date = new Date().toISOString().split('T')[0]) {
    const queryClient = useQueryClient();

    // Fetch meal plans for a specific date
    const { data: plannedMeals = [], isLoading } = useQuery({
        queryKey: ['meal_plans', userId, date],
        queryFn: async () => {
            if (!userId) return [];
            const { data, error } = await supabase
                .from('meal_plans')
                .select('*')
                .eq('user_id', userId)
                .eq('date', date)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!userId,
    });

    // Save a batch of generated meals to the plan
    const savePlanToDb = useMutation({
        mutationFn: async (mealsToInsert) => {
            if (!userId) throw new Error('User not authenticated');
            
            const records = mealsToInsert.map(meal => ({
                user_id: userId,
                date: meal.date || date,
                meal_type: meal.type,
                meal_name: meal.name,
                description: meal.description,
                calories: meal.calories,
                protein: meal.protein,
                carbs: meal.carbs,
                fats: meal.fats,
                is_logged: false
            }));

            const { data, error } = await supabase
                .from('meal_plans')
                .insert(records)
                .select();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meal_plans', userId] });
        }
    });

    // Mark a planned meal as logged
    const markMealAsLogged = useMutation({
        mutationFn: async (mealId) => {
            const { error } = await supabase
                .from('meal_plans')
                .update({ is_logged: true })
                .eq('id', mealId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meal_plans', userId] });
        }
    });

    // Delete a planned meal
    const deletePlannedMeal = useMutation({
        mutationFn: async (mealId) => {
            const { error } = await supabase
                .from('meal_plans')
                .delete()
                .eq('id', mealId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meal_plans', userId] });
        }
    });

    return {
        plannedMeals,
        isLoading,
        savePlanToDb: savePlanToDb.mutateAsync,
        isSaving: savePlanToDb.isPending,
        markMealAsLogged: markMealAsLogged.mutateAsync,
        deletePlannedMeal: deletePlannedMeal.mutateAsync
    };
}
