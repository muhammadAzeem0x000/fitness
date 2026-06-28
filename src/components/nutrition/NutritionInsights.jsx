import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Activity, Flame, TrendingUp, Target, Dumbbell } from 'lucide-react';
import { calculateAdaptiveTDEE } from '../../lib/nutritionUtils';
import { supabase } from '../../lib/supabase';

export function NutritionInsights({ user, currentTDEE, weeklyAverages }) {
    const [adaptiveTDEE, setAdaptiveTDEE] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        
        async function fetchAdaptiveData() {
            try {
                // Fetch last 14 days of weight logs
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - 14);
                const cutoffStr = cutoff.toISOString().split('T')[0];

                const [weightRes, nutritionRes] = await Promise.all([
                    supabase
                        .from('weight_logs')
                        .select('date, weight')
                        .eq('user_id', user.id)
                        .gte('date', cutoffStr)
                        .order('date', { ascending: true }),
                    supabase
                        .from('nutrition_logs')
                        .select('date, calories')
                        .eq('user_id', user.id)
                        .gte('date', cutoffStr)
                ]);

                if (weightRes.data && nutritionRes.data) {
                    const adaptive = calculateAdaptiveTDEE(weightRes.data, nutritionRes.data, currentTDEE);
                    setAdaptiveTDEE(adaptive);
                }
            } catch (err) {
                console.error("Error calculating adaptive TDEE:", err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchAdaptiveData();
    }, [user?.id, currentTDEE]);

    const getProgressColor = (current, target) => {
        if (!target) return 'bg-slate-200';
        const percent = (current / target) * 100;
        if (percent < 85) return 'bg-blue-500'; // Under
        if (percent > 115) return 'bg-rose-500'; // Over
        return 'bg-emerald-500'; // Perfect
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white px-2">Insights</h2>
            
            <div className="grid grid-cols-2 gap-3">
                <Card className="border-0 bg-gradient-to-br from-violet-500/10 to-purple-500/5 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2 text-violet-600 dark:text-violet-400">
                            <Activity className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Adaptive TDEE</span>
                        </div>
                        {isLoading ? (
                            <div className="h-7 w-20 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
                        ) : (
                            <div>
                                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-baseline gap-1">
                                    {adaptiveTDEE || currentTDEE} <span className="text-sm font-medium text-slate-500">kcal</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-tight">
                                    {adaptiveTDEE !== currentTDEE ? 'Adjusted based on your 14-day weight trend.' : 'Need more data to calculate.'}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-0 bg-white dark:bg-slate-900 border border-slate-100 dark:border-zinc-800 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2 text-rose-500">
                            <Flame className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Streak</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-baseline gap-1">
                            12 <span className="text-sm font-medium text-slate-500">days</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-tight">
                            Logged food consecutively. Keep it up!
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-0 bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-zinc-800">
                <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        <h3 className="font-semibold text-lg">7-Day Averages</h3>
                    </div>

                    <div className="space-y-3">
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-zinc-400 font-medium">Calories</span>
                                <span className="text-slate-800 dark:text-slate-200 font-bold">{weeklyAverages.calories} <span className="font-normal text-slate-500">/ {currentTDEE}</span></span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all ${getProgressColor(weeklyAverages.calories, currentTDEE)}`} 
                                    style={{ width: `${Math.min(100, (weeklyAverages.calories / (currentTDEE || 1)) * 100)}%` }} 
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-zinc-400 font-medium">Protein</span>
                                <span className="text-slate-800 dark:text-slate-200 font-bold">{weeklyAverages.protein}g</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, (weeklyAverages.protein / 150) * 100)}%` }} // Placeholder 150g target
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
