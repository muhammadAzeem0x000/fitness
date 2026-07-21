import React from 'react';
import { Plus, Zap, Flame } from 'lucide-react';
import { hapticLight } from '../../lib/haptics';

export function QuickAddFavorites({ frequentFoods = [], onAdd }) {
    if (!frequentFoods || frequentFoods.length === 0) return null;

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-amber-500/10 text-amber-500">
                        <Zap className="w-4 h-4 fill-amber-500" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                        Quick Add
                    </span>
                </div>
                <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                    Frequently Eaten
                </span>
            </div>

            {/* Horizontal Scroll List with Fade Gradient */}
            <div className="relative">
                <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-4 px-4 snap-x">
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
                            className="snap-start flex-none group flex flex-col justify-between p-3.5 min-w-[170px] max-w-[210px] rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900/90 dark:to-zinc-950/90 border border-slate-200/80 dark:border-zinc-800/80 hover:border-amber-500/40 dark:hover:border-amber-500/40 shadow-sm hover:shadow-md transition-all duration-300 text-left active:scale-[0.98]"
                        >
                            {/* Card Header & Name */}
                            <div className="mb-3">
                                <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                                    <Flame className="w-3.5 h-3.5 fill-amber-500/20" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                        Quick Item
                                    </span>
                                </div>
                                <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-amber-500 transition-colors">
                                    {food.food_text}
                                </h5>
                            </div>

                            {/* Card Footer with Calorie & Plus Button */}
                            <div className="flex items-center justify-between w-full pt-2 border-t border-slate-200/50 dark:border-zinc-800/60">
                                <div className="flex flex-col">
                                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                                        {food.calories || 0}
                                        <span className="text-[10px] font-normal text-slate-400 dark:text-zinc-500 ml-1">kcal</span>
                                    </span>
                                </div>
                                <div className="w-7 h-7 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-orange-500 group-hover:text-white shadow-sm transition-all duration-300">
                                    <Plus className="w-4 h-4" />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
