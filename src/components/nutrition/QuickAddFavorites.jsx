import React from 'react';
import { Plus, Zap } from 'lucide-react';
import { hapticLight, hapticSuccess } from '../../lib/haptics';

export function QuickAddFavorites({ frequentFoods = [], onAdd }) {
    if (!frequentFoods || frequentFoods.length === 0) return null;

    return (
        <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2 px-1">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Quick Add</span>
            </div>
            <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 -mx-4 px-4 snap-x">
                {frequentFoods.map((food, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            hapticLight();
                            onAdd({
                                food_text: food.food_text,
                                calories: food.calories,
                                protein: food.protein,
                                carbs: food.carbs,
                                fats: food.fats
                            });
                        }}
                        className="snap-start flex-none flex flex-col items-start bg-white dark:bg-slate-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 min-w-[120px] max-w-[150px] shadow-sm hover:border-violet-300 dark:hover:border-violet-700/50 transition-colors"
                    >
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate w-full text-left">
                            {food.food_text}
                        </span>
                        <div className="flex items-center justify-between w-full mt-1.5">
                            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                                {food.calories} cal
                            </span>
                            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                <Plus className="w-3 h-3" />
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
