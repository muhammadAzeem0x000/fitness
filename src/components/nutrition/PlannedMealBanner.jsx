import React from 'react';
import { UtensilsCrossed, CheckCircle2, X } from 'lucide-react';
import { hapticLight, hapticSuccess } from '../../lib/haptics';
import { useMealPlan } from '../../hooks/useMealPlan';
import { useNutrition } from '../../hooks/useNutrition';
import { useAuth } from '../../hooks/useAuth';

export function PlannedMealBanner({ date }) {
    const { user } = useAuth();
    const { plannedMeals, markMealAsLogged } = useMealPlan(user?.id, date);
    const { addNutritionLog } = useNutrition(user?.id, date);

    // Get the first unlogged meal for today
    const nextMeal = plannedMeals?.find(m => !m.is_logged);

    if (!nextMeal) return null;

    const handleLogIt = async () => {
        hapticSuccess();
        try {
            // Add to nutrition_logs
            await addNutritionLog({
                food_text: nextMeal.name,
                calories: nextMeal.calories,
                protein: nextMeal.protein,
                carbs: nextMeal.carbs,
                fats: nextMeal.fats
            });
            // Mark as logged in meal_plans
            await markMealAsLogged(nextMeal.id);
        } catch (error) {
            console.error("Failed to log planned meal", error);
        }
    };

    const handleSkip = async () => {
        hapticLight();
        try {
            // Just mark as logged so it disappears
            await markMealAsLogged(nextMeal.id);
        } catch (error) {
            console.error("Failed to skip planned meal", error);
        }
    };

    return (
        <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
                <UtensilsCrossed className="w-24 h-24 text-violet-500" />
            </div>

            <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <UtensilsCrossed className="w-3 h-3" />
                            Planned {nextMeal.meal_type}
                        </div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-lg leading-tight">
                            {nextMeal.meal_name}
                        </h4>
                        <div className="text-xs text-slate-500 mt-1 flex gap-2">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{nextMeal.calories} kcal</span>
                            <span>•</span>
                            <span>P: {nextMeal.protein}g</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mt-1">
                    <button 
                        onClick={handleLogIt}
                        className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1 shadow-sm shadow-violet-500/20"
                    >
                        <CheckCircle2 className="w-4 h-4" /> Log It
                    </button>
                    <button 
                        onClick={handleSkip}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center"
                        title="Skip this meal"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
