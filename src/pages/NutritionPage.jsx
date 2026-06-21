import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loader2, Plus, Sparkles, Target, Trash2, Utensils } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useNutrition } from '../hooks/useNutrition';
import { calculateTDEE, calculateBMR, calculateTargetMacros } from '../lib/nutritionUtils';
import { analyzeFoodInput } from '../lib/openai';
import { PremiumGate } from '../components/premium/PremiumGate';
import { MealPlanGenerator } from '../components/nutrition/MealPlanGenerator';

export function NutritionPage() {
    const { user } = useAuth();
    const { profile } = useProfile(user?.id);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const { nutritionLogs, dailyTotals, addNutritionLog, deleteNutritionLog, isLoading: logsLoading } = useNutrition(user?.id, selectedDate);
    
    const [foodInput, setFoodInput] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [mealType, setMealType] = useState('Snack');

    // Calculate Targets
    const targets = useMemo(() => {
        if (!profile || !profile.current_weight || !profile.height || !profile.age || !profile.gender || !profile.activity_level) {
            return null; // Missing profile data
        }
        const bmr = calculateBMR(parseFloat(profile.current_weight), parseFloat(profile.height), profile.age, profile.gender);
        const tdee = calculateTDEE(bmr, profile.activity_level);
        return calculateTargetMacros(tdee, parseFloat(profile.current_weight), profile.goal_type || 'maintain');
    }, [profile]);

    const handleLogFood = async (e) => {
        e.preventDefault();
        if (!foodInput.trim()) return;

        setIsParsing(true);
        try {
            const result = await analyzeFoodInput(foodInput);
            await addNutritionLog({
                meal_type: mealType,
                food_text: result.food_name || foodInput,
                calories: result.calories || 0,
                protein: result.protein || 0,
                carbs: result.carbs || 0,
                fats: result.fats || 0
            });
            setFoodInput('');
        } catch (error) {
            console.error("Failed to parse food:", error);
            alert(`Failed: ${error?.message || "Unknown error"}`);
        } finally {
            setIsParsing(false);
        }
    };

    const MacroRing = ({ label, consumed, target, colorClass }) => {
        const percentage = target ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
        
        return (
            <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" className="stroke-slate-200 dark:stroke-zinc-800" strokeWidth="8" fill="none" />
                        <circle 
                            cx="50" cy="50" r="40" 
                            className={`transition-all duration-1000 ease-out ${colorClass}`} 
                            strokeWidth="8" fill="none" 
                            strokeDasharray="251.2" 
                            strokeDashoffset={251.2 - (251.2 * percentage) / 100}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-lg font-bold">{consumed}</span>
                        <span className="text-[10px] text-slate-500">/ {target || 0}{label === 'Calories' ? '' : 'g'}</span>
                    </div>
                </div>
                <span className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
            </div>
        );
    };

    if (!profile) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">AI Nutrition</h1>
                    <p className="text-slate-500 dark:text-slate-400">Track macros seamlessly using natural language.</p>
                </div>
                <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500"
                />
            </div>

            {!targets && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                    <Target className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-amber-800 dark:text-amber-400">Profile Incomplete</h4>
                        <p className="text-sm text-amber-700 dark:text-amber-500/80 mt-1">
                            Please update your profile with your Age, Gender, and Activity Level to calculate your personalized macro targets.
                        </p>
                    </div>
                </div>
            )}

            {/* Macro Overview */}
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <MacroRing label="Calories" consumed={dailyTotals.calories} target={targets?.calories} colorClass="stroke-emerald-500" />
                        <MacroRing label="Protein" consumed={dailyTotals.protein} target={targets?.protein} colorClass="stroke-blue-500" />
                        <MacroRing label="Carbs" consumed={dailyTotals.carbs} target={targets?.carbs} colorClass="stroke-amber-500" />
                        <MacroRing label="Fats" consumed={dailyTotals.fats} target={targets?.fats} colorClass="stroke-rose-500" />
                    </div>
                </CardContent>
            </Card>

            <PremiumGate feature="AI Food Logging">
                <div className="grid md:grid-cols-12 gap-6">
                    {/* Logger Section */}
                    <div className="md:col-span-5 space-y-6">
                        <Card className="border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 shadow-emerald-500/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                    <Sparkles className="w-5 h-5" />
                                    AI Food Logger
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleLogFood} className="space-y-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Type what you ate naturally, and our AI will estimate the macros instantly.
                                    </p>
                                    <select 
                                        value={mealType} 
                                        onChange={(e) => setMealType(e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm"
                                    >
                                        <option value="Breakfast">Breakfast</option>
                                        <option value="Lunch">Lunch</option>
                                        <option value="Dinner">Dinner</option>
                                        <option value="Snack">Snack</option>
                                    </select>
                                    <textarea
                                        value={foodInput}
                                        onChange={(e) => setFoodInput(e.target.value)}
                                        placeholder="e.g. 2 scrambled eggs, a slice of whole wheat toast, and black coffee"
                                        className="w-full h-24 px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm resize-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <Button 
                                        type="submit" 
                                        disabled={isParsing || !foodInput.trim()}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        {isParsing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                        {isParsing ? 'Analyzing...' : 'Log Food'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Food Log List */}
                    <div className="md:col-span-7">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Utensils className="w-5 h-5" />
                                    Today's Meals
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {logsLoading ? (
                                    <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                                ) : nutritionLogs.length === 0 ? (
                                    <div className="text-center p-8 text-slate-500">
                                        No food logged for this date.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(type => {
                                            const meals = nutritionLogs.filter(log => log.meal_type === type);
                                            if (meals.length === 0) return null;
                                            
                                            const typeCals = meals.reduce((sum, log) => sum + (log.calories || 0), 0);
                                            
                                            return (
                                                <div key={type} className="space-y-2">
                                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-1">
                                                        <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">{type}</h4>
                                                        <span className="text-xs font-medium text-slate-500">{typeCals} kcal</span>
                                                    </div>
                                                    {meals.map(log => (
                                                        <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors group">
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-sm truncate">{log.food_text}</p>
                                                                <div className="flex gap-3 text-xs text-slate-500 mt-1">
                                                                    <span>{log.calories} kcal</span>
                                                                    <span>P: {log.protein}g</span>
                                                                    <span>C: {log.carbs}g</span>
                                                                    <span>F: {log.fats}g</span>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                onClick={() => deleteNutritionLog(log.id)}
                                                                className="p-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        
                        {/* AI Meal Planner */}
                        <MealPlanGenerator targets={targets} />
                    </div>
                </div>
            </PremiumGate>
        </div>
    );
}
