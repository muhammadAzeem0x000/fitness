import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loader2, Plus, Sparkles, Target, Trash2, Utensils, CalendarDays, LineChart, CheckCircle2, ChevronDown, Flame, Award } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useNutrition } from '../hooks/useNutrition';
import { useMealPlan } from '../hooks/useMealPlan';
import { useSubscription } from '../hooks/useSubscription';
import { calculateTDEE, calculateBMR, calculateTargetMacros, getAdjustedTargets } from '../lib/nutritionUtils';
import { analyzeFoodInput } from '../lib/openai';
import { checkFeatureUsage } from '../lib/featureUsage';
import { PremiumGate } from '../components/premium/PremiumGate';

import { MealPlanGenerator } from '../components/nutrition/MealPlanGenerator';
import { MealPlanView } from '../components/nutrition/MealPlanView';
import { PlannedMealBanner } from '../components/nutrition/PlannedMealBanner';
import { QuickAddFavorites } from '../components/nutrition/QuickAddFavorites';
import { NutritionInsights } from '../components/nutrition/NutritionInsights';
import { FoodConfirmationModal } from '../components/nutrition/FoodConfirmationModal';
import { DatePickerModal } from '../components/ui/DatePickerModal';
import { NutritionSetupModal } from '../components/nutrition/NutritionSetupModal';
import { hapticLight, hapticSuccess } from '../lib/haptics';
import { useQuery } from '@tanstack/react-query';

export function NutritionPage() {
    const { user } = useAuth();
    const { profile } = useProfile(user?.id);
    const { isPremium } = useSubscription();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const { nutritionLogs, weeklyAverages, frequentFoods, dailyTotals, addNutritionLog, deleteNutritionLog, isLoading: logsLoading } = useNutrition(user?.id, selectedDate);
    
    // For Plan Tab
    const { plannedMeals, markMealAsLogged } = useMealPlan(user?.id, selectedDate);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    // Form state
    const [foodInput, setFoodInput] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [mealType, setMealType] = useState('Snack');
    const [isMealDropdownOpen, setIsMealDropdownOpen] = useState(false);
    
    // Food confirmation modal state
    const [pendingFood, setPendingFood] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    
    // Tab state
    const [activeTab, setActiveTab] = useState('track'); // track, plan, insights

    const MEAL_ICONS = {
        Breakfast: '🍳',
        Lunch: '🥗',
        Dinner: '🍲',
        Snack: '🍎'
    };

    // Check free user meal plan quota for conditional PremiumGate
    const { data: mealPlanQuota } = useQuery({
        queryKey: ['featureUsage', user?.id, 'ai_meal_plan'],
        queryFn: () => checkFeatureUsage(user.id, 'ai_meal_plan', 1, 30),
        enabled: !!user?.id && !isPremium,
    });
    const freePlanAllowed = isPremium || (mealPlanQuota?.remaining > 0);

    // Calculate Targets
    const targets = useMemo(() => {
        if (!profile || !profile.current_weight || !profile.height || !profile.age || !profile.gender || !profile.activity_level) {
            return null;
        }
        const bmr = calculateBMR(parseFloat(profile.current_weight), parseFloat(profile.height), profile.age, profile.gender);
        const tdee = calculateTDEE(bmr, profile.activity_level);
        const baseTargets = calculateTargetMacros(tdee, parseFloat(profile.current_weight), profile.goal_type || 'maintain');
        
        return getAdjustedTargets(baseTargets, profile.workout_days, selectedDate);
    }, [profile, selectedDate]);

    const handleLogFood = async (e) => {
        e.preventDefault();
        if (!foodInput.trim()) return;

        setIsParsing(true);
        try {
            const result = await analyzeFoodInput(foodInput);
            setPendingFood(result);
            setIsConfirmModalOpen(true);
        } catch (error) {
            console.error("Failed to parse food:", error);
            alert(`Failed: ${error?.message || "Unknown error"}`);
        } finally {
            setIsParsing(false);
        }
    };

    const handleConfirmFood = async (confirmedData) => {
        try {
            await addNutritionLog({
                meal_type: confirmedData.mealType || mealType,
                food_text: confirmedData.food_name || foodInput,
                calories: confirmedData.calories || 0,
                protein: confirmedData.protein || 0,
                carbs: confirmedData.carbs || 0,
                fats: confirmedData.fats || 0
            });
            setFoodInput('');
            setIsConfirmModalOpen(false);
            setPendingFood(null);
            hapticSuccess();
        } catch (error) {
            console.error("Failed to log food:", error);
            alert(`Failed: ${error?.message || "Unknown error"}`);
        }
    };

    const handleQuickAdd = async (food) => {
        try {
            await addNutritionLog({
                meal_type: mealType,
                food_text: food.food_text,
                calories: food.calories || 0,
                protein: food.protein || 0,
                carbs: food.carbs || 0,
                fats: food.fats || 0
            });
            hapticSuccess();
        } catch (error) {
            console.error("Failed quick add:", error);
        }
    };

    const handleLogEaten = async (meal) => {
        try {
            await addNutritionLog({
                meal_type: meal.type,
                food_text: meal.name,
                calories: meal.calories || 0,
                protein: meal.protein || 0,
                carbs: meal.carbs || 0,
                fats: meal.fats || 0
            });
            hapticSuccess();
            setActiveTab('track');
        } catch (error) {
            console.error("Failed log eaten:", error);
        }
    };

    // Modern Ring Component with Gradient and Glow
    const MacroRing = ({ label, consumed, target, colorClass, glowColor }) => {
        const percentage = target ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
        
        return (
            <div className="flex flex-col items-center">
                <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle 
                            cx="50" cy="50" r="40" 
                            className="stroke-slate-200/60 dark:stroke-zinc-800/80" 
                            strokeWidth="8" fill="none" 
                        />
                        <circle 
                            cx="50" cy="50" r="40" 
                            className={`transition-all duration-1000 ease-out ${colorClass}`} 
                            strokeWidth="8" fill="none" 
                            strokeDasharray="251.2" 
                            strokeDashoffset={251.2 - (251.2 * percentage) / 100}
                            strokeLinecap="round"
                            style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-base font-black text-slate-900 dark:text-white leading-none">
                            {consumed}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 mt-0.5">
                            / {target || 0}
                        </span>
                    </div>
                </div>
                <span className="mt-2 text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {label}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
                    {percentage}%
                </span>
            </div>
        );
    };

    if (!profile) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;

    const remainingBudget = targets ? {
        calories: Math.max(0, targets.calories - dailyTotals.calories),
        protein: Math.max(0, targets.protein - dailyTotals.protein),
        carbs: Math.max(0, targets.carbs - dailyTotals.carbs),
        fats: Math.max(0, targets.fats - dailyTotals.fats)
    } : null;

    return (
        <div className="animate-in fade-in duration-500 max-w-lg mx-auto md:max-w-none md:mx-0 min-h-screen bg-slate-50 dark:bg-black pb-24 md:pb-12">
            
            {/* Sticky Nutrition Header (100% solid background, pinned at top-0 of main scroll container without negative margin peeking) */}
            <div className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-zinc-800 shadow-md transition-all -mx-3 md:-mx-4 px-4 pt-4 pb-4">
                <div className="flex justify-between items-center mb-4 mt-1">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
                        <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
                            <Utensils className="w-6 h-6" />
                        </div>
                        Nutrition
                    </h1>
                    <button 
                        onClick={() => { hapticLight(); setIsDatePickerOpen(true); }}
                        className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 transition-colors active:scale-95 border border-slate-200/50 dark:border-zinc-700/50"
                    >
                        <CalendarDays className="w-4 h-4 text-violet-500" />
                        {new Date(selectedDate + 'T12:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric', year: new Date().getFullYear() !== new Date(selectedDate).getFullYear() ? 'numeric' : undefined })}
                    </button>
                </div>

                <DatePickerModal 
                    isOpen={isDatePickerOpen}
                    onClose={() => setIsDatePickerOpen(false)}
                    selectedDate={selectedDate}
                    onSelectDate={(dateStr) => setSelectedDate(dateStr)}
                />

                {/* Tabs */}
                <div className="flex bg-slate-100 dark:bg-zinc-800/60 p-1.5 rounded-2xl border border-slate-200/40 dark:border-zinc-700/40">
                    <button 
                        onClick={() => { hapticLight(); setActiveTab('track'); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'track' ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-md ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'}`}
                    >
                        <Utensils className="w-4 h-4" /> Track
                    </button>
                    <button 
                        onClick={() => { hapticLight(); setActiveTab('plan'); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'plan' ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-md ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'}`}
                    >
                        <CalendarDays className="w-4 h-4" /> Plan
                    </button>
                    <button 
                        onClick={() => { hapticLight(); setActiveTab('insights'); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'insights' ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-md ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'}`}
                    >
                        <LineChart className="w-4 h-4" /> Insights
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {!targets && (
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-5 text-white shadow-xl shadow-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <Target className="w-6 h-6 text-amber-100 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-lg tracking-tight">Nutrition Profile Incomplete</h4>
                                <p className="text-amber-100 text-sm mt-1">
                                    Set your body details to unlock personalized daily targets.
                                </p>
                            </div>
                        </div>
                        <Button 
                            onClick={() => { hapticLight(); setIsSetupModalOpen(true); }}
                            className="bg-white/20 hover:bg-white/30 text-white border-0 h-11 px-6 rounded-2xl font-bold backdrop-blur-md transition-all active:scale-95 shrink-0 shadow-sm"
                        >
                            Setup Now
                        </Button>
                    </div>
                )}

                {/* TRACK TAB */}
                {activeTab === 'track' && (
                    <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                        
                        {/* Macro Overview Card */}
                        <div className="relative overflow-hidden bg-white dark:bg-slate-900/90 rounded-3xl p-5 shadow-lg border border-slate-200/80 dark:border-zinc-800/80 backdrop-blur-md">
                            <div className="flex justify-between items-center mb-5">
                                <div>
                                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                                        Daily Progress
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                                        Real-time macro balance
                                    </p>
                                </div>
                                {targets?.isTrainingDay && (
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide bg-gradient-to-r from-violet-600/15 via-indigo-600/15 to-purple-600/15 border border-violet-500/30 text-violet-600 dark:text-violet-400 px-3 py-1.5 rounded-full shadow-sm">
                                        🏋️ Training Day (+250 kcal)
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
                                <MacroRing label="Calories" consumed={dailyTotals.calories} target={targets?.calories} colorClass="stroke-emerald-500" glowColor="rgba(16,185,129,0.3)" />
                                <MacroRing label="Protein" consumed={dailyTotals.protein} target={targets?.protein} colorClass="stroke-blue-500" glowColor="rgba(59,130,246,0.3)" />
                                <MacroRing label="Carbs" consumed={dailyTotals.carbs} target={targets?.carbs} colorClass="stroke-amber-500" glowColor="rgba(245,158,11,0.3)" />
                                <MacroRing label="Fats" consumed={dailyTotals.fats} target={targets?.fats} colorClass="stroke-rose-500" glowColor="rgba(244,63,94,0.3)" />
                            </div>
                            
                            {/* Remaining Budget Chips */}
                            {remainingBudget && (
                                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
                                    <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
                                        <span className="text-slate-500 dark:text-zinc-400">Remaining:</span>
                                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                                            {remainingBudget.calories} kcal
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                                            {remainingBudget.protein}g P
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                                            {remainingBudget.carbs}g C
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                                            {remainingBudget.fats}g F
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Planned Meal Banner */}
                        <PlannedMealBanner date={selectedDate} />

                        <div className="space-y-6">
                            {/* AI Food Logger Card */}
                            <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-5 shadow-lg border border-slate-200/80 dark:border-zinc-800/80 relative z-20 overflow-visible">
                                <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-violet-500/15 via-indigo-500/10 to-transparent rounded-bl-full pointer-events-none rounded-tr-3xl" />
                                
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-violet-500" /> Log Food
                                    </h3>
                                    <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                                        AI Natural Language
                                    </span>
                                </div>
                                
                                <QuickAddFavorites frequentFoods={frequentFoods} onAdd={handleQuickAdd} />

                                <form onSubmit={handleLogFood} className="space-y-3.5 relative z-10">
                                    <div className="flex gap-2.5">
                                        {/* Meal Type Dropdown (Opens upward) */}
                                        <div className="relative w-1/3 min-w-[110px]">
                                            <button
                                                type="button"
                                                onClick={() => { hapticLight(); setIsMealDropdownOpen(!isMealDropdownOpen); }}
                                                className="w-full flex items-center justify-between px-3 py-3 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-2xl text-sm font-semibold text-slate-900 dark:text-slate-100 hover:border-violet-400 focus:ring-2 focus:ring-violet-500 outline-none transition-colors"
                                            >
                                                <span className="flex items-center gap-1.5 truncate">
                                                    <span>{MEAL_ICONS[mealType] || '🍎'}</span>
                                                    <span>{mealType}</span>
                                                </span>
                                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isMealDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            
                                            {isMealDropdownOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setIsMealDropdownOpen(false)} />
                                                    <div className="absolute bottom-full left-0 mb-2 w-40 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 p-1.5">
                                                        {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(type => (
                                                            <button
                                                                key={type}
                                                                type="button"
                                                                onClick={() => {
                                                                    hapticLight();
                                                                    setMealType(type);
                                                                    setIsMealDropdownOpen(false);
                                                                }}
                                                                className={`w-full flex items-center gap-2.5 text-left px-3 py-2.5 text-sm font-bold rounded-xl transition-all ${mealType === type ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-700/80'}`}
                                                            >
                                                                <span className="text-base">{MEAL_ICONS[type]}</span>
                                                                <span>{type}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Input Box */}
                                        <input
                                            type="text"
                                            value={foodInput}
                                            onChange={(e) => setFoodInput(e.target.value)}
                                            placeholder="e.g. 2 eggs and toast"
                                            className="flex-1 px-4 py-3 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 outline-none transition-colors"
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <Button 
                                        type="submit" 
                                        disabled={isParsing || !foodInput.trim()}
                                        className="w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-2xl h-12 shadow-lg shadow-violet-500/25 active:scale-[0.98] transition-all"
                                    >
                                        {isParsing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Plus className="w-5 h-5 mr-2" />}
                                        {isParsing ? 'Analyzing Nutrition...' : 'Log It'}
                                    </Button>
                                </form>
                            </div>

                            {/* Today's Log Section */}
                            <div className="space-y-4">
                                <h3 className="font-extrabold text-base text-slate-900 dark:text-white ml-1 tracking-tight">
                                    Today's Log
                                </h3>
                                {logsLoading ? (
                                    <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                                ) : nutritionLogs.length === 0 ? (
                                    <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-8 text-center text-sm text-slate-500 dark:text-zinc-500 shadow-sm border border-slate-200/80 dark:border-zinc-800/80">
                                        No food logged yet today.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(type => {
                                            const meals = nutritionLogs.filter(log => log.meal_type === type);
                                            if (meals.length === 0) return null;
                                            const typeCals = meals.reduce((sum, log) => sum + (log.calories || 0), 0);
                                            
                                            return (
                                                <div key={type} className="bg-white dark:bg-slate-900/90 rounded-3xl p-4 shadow-sm border border-slate-200/80 dark:border-zinc-800/80">
                                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-3 mb-3">
                                                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                            <span>{MEAL_ICONS[type]}</span>
                                                            <span>{type}</span>
                                                        </h4>
                                                        <span className="text-xs font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-xl">
                                                            {typeCals} kcal
                                                        </span>
                                                    </div>
                                                    <div className="space-y-2.5">
                                                        {meals.map(log => (
                                                            <div key={log.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/40 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors group">
                                                                <div className="min-w-0 pr-3">
                                                                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{log.food_text}</p>
                                                                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                                                                        <span className="font-bold text-slate-800 dark:text-zinc-200">{log.calories} kcal</span>
                                                                        <span>•</span>
                                                                        <span>{log.protein}g P</span>
                                                                        <span>•</span>
                                                                        <span>{log.carbs}g C</span>
                                                                        <span>•</span>
                                                                        <span>{log.fats}g F</span>
                                                                    </div>
                                                                </div>
                                                                <button 
                                                                    onClick={() => { hapticLight(); deleteNutritionLog(log.id); }}
                                                                    className="p-2 text-rose-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-rose-500/10 rounded-xl"
                                                                    title="Delete log"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}

                {/* PLAN TAB */}
                {activeTab === 'plan' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        {freePlanAllowed ? (
                        <>
                            {generatedPlan ? (
                                <MealPlanView 
                                    planData={generatedPlan} 
                                    date={selectedDate} 
                                    onLogEaten={handleLogEaten}
                                    onPlanUpdate={(updatedPlan) => setGeneratedPlan(updatedPlan)}
                                />
                            ) : plannedMeals?.length > 0 ? (
                                <div className="space-y-4">
                                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white ml-1 tracking-tight">Planned for Today</h3>
                                    {plannedMeals.map(meal => (
                                        <div key={meal.id} className={`bg-white dark:bg-slate-900/90 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-zinc-800/80 ${meal.is_logged ? 'opacity-60' : ''}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">{meal.meal_type}</span>
                                                    <h4 className="font-bold text-slate-900 dark:text-slate-100 mt-1">{meal.meal_name}</h4>
                                                </div>
                                                <span className="text-xs font-black bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl text-slate-800 dark:text-slate-200">
                                                    ~{meal.calories} kcal
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">{meal.description}</p>
                                            <div className="flex justify-between items-end">
                                                <div className="flex gap-3 text-xs font-bold text-slate-500 dark:text-zinc-400">
                                                    <span>P: {meal.protein}g</span>
                                                    <span>C: {meal.carbs}g</span>
                                                    <span>F: {meal.fats}g</span>
                                                </div>
                                                {!meal.is_logged && (
                                                    <Button 
                                                        size="sm" 
                                                        onClick={async () => {
                                                            hapticSuccess();
                                                            await addNutritionLog({
                                                                food_text: meal.meal_name,
                                                                meal_type: meal.meal_type,
                                                                calories: meal.calories,
                                                                protein: meal.protein,
                                                                carbs: meal.carbs,
                                                                fats: meal.fats
                                                            });
                                                            await markMealAsLogged(meal.id);
                                                        }}
                                                        className="h-9 px-4 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/20"
                                                    >
                                                        Log It
                                                    </Button>
                                                )}
                                                {meal.is_logged && (
                                                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                                                        <CheckCircle2 className="w-4 h-4" /> Logged
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900/90 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800 text-center shadow-sm mt-4">
                                    <div className="w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center mb-4 text-violet-500">
                                        <CalendarDays className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">No Plan Yet</h3>
                                    <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 mb-6 max-w-[250px] mx-auto">
                                        Generate a personalized, multi-day meal plan tailored to your macros.
                                    </p>
                                </div>
                            )}

                            {/* Floating Generate Button */}
                            <div className="fixed bottom-20 left-0 right-0 p-4 flex justify-center z-40 pointer-events-none">
                                <Button 
                                    onClick={() => { hapticLight(); setIsGeneratorOpen(true); }}
                                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full h-14 px-8 shadow-xl shadow-slate-900/20 flex items-center gap-2 font-bold text-base pointer-events-auto hover:scale-105 transition-transform"
                                >
                                    <Sparkles className="w-5 h-5 text-violet-400 dark:text-violet-600" />
                                    {generatedPlan || plannedMeals?.length > 0 ? 'Generate New Plan' : 'Generate Plan'}
                                </Button>
                            </div>

                            <MealPlanGenerator 
                                isOpen={isGeneratorOpen} 
                                onClose={() => setIsGeneratorOpen(false)} 
                                onGenerated={(plan) => setGeneratedPlan(plan)}
                                targets={targets} 
                                foodHistory={nutritionLogs}
                            />
                        </>
                        ) : (
                            <PremiumGate feature="AI Meal Planning" />
                        )}
                    </div>
                )}

                {/* INSIGHTS TAB */}
                {activeTab === 'insights' && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <PremiumGate feature="Nutrition Insights">
                            <NutritionInsights 
                                user={user} 
                                currentTDEE={targets?.calories || 2000} 
                                weeklyAverages={weeklyAverages} 
                            />
                        </PremiumGate>
                    </div>
                )}

            </div>
            <NutritionSetupModal 
                isOpen={isSetupModalOpen} 
                onClose={() => setIsSetupModalOpen(false)} 
            />
            <FoodConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => { setIsConfirmModalOpen(false); setPendingFood(null); }}
                parsedData={pendingFood}
                mealType={mealType}
                onConfirm={handleConfirmFood}
            />
        </div>
    );
}
