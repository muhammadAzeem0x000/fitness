import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loader2, Plus, Sparkles, Target, Trash2, Utensils, CalendarDays, LineChart, CheckCircle2, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useNutrition } from '../hooks/useNutrition';
import { useMealPlan } from '../hooks/useMealPlan';
import { calculateTDEE, calculateBMR, calculateTargetMacros, getAdjustedTargets } from '../lib/nutritionUtils';
import { analyzeFoodInput } from '../lib/openai';
import { PremiumGate } from '../components/premium/PremiumGate';

import { MealPlanGenerator } from '../components/nutrition/MealPlanGenerator';
import { MealPlanView } from '../components/nutrition/MealPlanView';
import { PlannedMealBanner } from '../components/nutrition/PlannedMealBanner';
import { QuickAddFavorites } from '../components/nutrition/QuickAddFavorites';
import { NutritionInsights } from '../components/nutrition/NutritionInsights';
import { DatePickerModal } from '../components/ui/DatePickerModal';
import { NutritionSetupModal } from '../components/nutrition/NutritionSetupModal';
import { hapticLight, hapticSuccess } from '../lib/haptics';

export function NutritionPage() {
    const { user } = useAuth();
    const { profile } = useProfile(user?.id);
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
    
    // Tab state
    const [activeTab, setActiveTab] = useState('track'); // track, plan, insights

    // Calculate Targets
    const targets = useMemo(() => {
        if (!profile || !profile.current_weight || !profile.height || !profile.age || !profile.gender || !profile.activity_level) {
            return null;
        }
        const bmr = calculateBMR(parseFloat(profile.current_weight), parseFloat(profile.height), profile.age, profile.gender);
        const tdee = calculateTDEE(bmr, profile.activity_level);
        const baseTargets = calculateTargetMacros(tdee, parseFloat(profile.current_weight), profile.goal_type || 'maintain');
        
        // Apply Training Day adjustments
        return getAdjustedTargets(baseTargets, profile.workout_days, selectedDate);
    }, [profile, selectedDate]);

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
            hapticSuccess();
        } catch (error) {
            console.error("Failed to parse food:", error);
            alert(`Failed: ${error?.message || "Unknown error"}`);
        } finally {
            setIsParsing(false);
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

    const MacroRing = ({ label, consumed, target, colorClass }) => {
        const percentage = target ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
        
        return (
            <div className="flex flex-col items-center">
                <div className="relative w-20 h-20 flex items-center justify-center">
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
                        <span className="text-base font-bold text-slate-800 dark:text-slate-100">{consumed}</span>
                        <span className="text-[9px] text-slate-500">/ {target || 0}</span>
                    </div>
                </div>
                <span className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
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
        <div className="animate-in fade-in duration-500 max-w-lg mx-auto md:max-w-none md:mx-0 min-h-screen bg-slate-50 dark:bg-black pb-24 -mt-4 -mx-3 md:mt-0 md:-mx-0 md:bg-transparent md:dark:bg-transparent">
            
            {/* Header / Date Picker */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-30 pt-4 px-4 pb-4 shadow-sm">
                <div className="flex justify-between items-center mb-4 mt-2">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Utensils className="w-6 h-6 text-violet-500" /> Nutrition
                    </h1>
                    <button 
                        onClick={() => { hapticLight(); setIsDatePickerOpen(true); }}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg text-sm font-medium text-slate-900 dark:text-slate-100 transition-colors active:scale-95 border border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500/50"
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
                <div className="flex bg-slate-100 dark:bg-zinc-800/50 p-1 rounded-xl">
                    <button 
                        onClick={() => { hapticLight(); setActiveTab('track'); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'track' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400'}`}
                    >
                        <Utensils className="w-4 h-4" /> Track
                    </button>
                    <button 
                        onClick={() => { hapticLight(); setActiveTab('plan'); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'plan' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400'}`}
                    >
                        <CalendarDays className="w-4 h-4" /> Plan
                    </button>
                    <button 
                        onClick={() => { hapticLight(); setActiveTab('insights'); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'insights' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400'}`}
                    >
                        <LineChart className="w-4 h-4" /> Insights
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {!targets && (
                    <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-5 text-white shadow-xl shadow-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                        
                        {/* Macro Overview */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-zinc-800">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Daily Progress</h3>
                                {targets?.isTrainingDay && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 px-2 py-1 rounded-full">
                                        🏋️ Training Day (+250 kcal)
                                    </span>
                                )}
                            </div>
                            <div className="flex justify-between items-center max-w-sm mx-auto">
                                <MacroRing label="Calories" consumed={dailyTotals.calories} target={targets?.calories} colorClass="stroke-emerald-500" />
                                <MacroRing label="Protein" consumed={dailyTotals.protein} target={targets?.protein} colorClass="stroke-blue-500" />
                                <MacroRing label="Carbs" consumed={dailyTotals.carbs} target={targets?.carbs} colorClass="stroke-amber-500" />
                                <MacroRing label="Fats" consumed={dailyTotals.fats} target={targets?.fats} colorClass="stroke-rose-500" />
                            </div>
                            
                            {/* Remaining Budget */}
                            {remainingBudget && (
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                                    <div className="text-center text-xs text-slate-500 dark:text-zinc-400">
                                        Remaining: <span className="font-semibold text-slate-700 dark:text-zinc-300">{remainingBudget.calories} kcal</span> • {remainingBudget.protein}g P • {remainingBudget.carbs}g C • {remainingBudget.fats}g F
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Planned Meal Banner */}
                        <PlannedMealBanner date={selectedDate} />


                            <div className="space-y-6">
                                {/* AI Logger */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-zinc-800 relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-transparent rounded-bl-full rounded-tr-2xl pointer-events-none" />
                                    
                                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-violet-500" /> Log Food
                                    </h3>
                                    
                                    <QuickAddFavorites frequentFoods={frequentFoods} onAdd={handleQuickAdd} />

                                    <form onSubmit={handleLogFood} className="space-y-3 relative z-10">
                                        <div className="flex gap-2">
                                            <div className="relative w-1/3">
                                                <button
                                                    type="button"
                                                    onClick={() => { hapticLight(); setIsMealDropdownOpen(!isMealDropdownOpen); }}
                                                    className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-500 outline-none"
                                                >
                                                    {mealType}
                                                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isMealDropdownOpen ? 'rotate-180' : ''}`} />
                                                </button>
                                                {isMealDropdownOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" onClick={() => setIsMealDropdownOpen(false)} />
                                                        <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                            {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(type => (
                                                                <button
                                                                    key={type}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        hapticLight();
                                                                        setMealType(type);
                                                                        setIsMealDropdownOpen(false);
                                                                    }}
                                                                    className={`w-full text-left px-3 py-2.5 text-sm font-medium transition-colors ${mealType === type ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-700'}`}
                                                                >
                                                                    {type}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                value={foodInput}
                                                onChange={(e) => setFoodInput(e.target.value)}
                                                placeholder="e.g. 2 eggs and toast"
                                                className="w-2/3 px-3 py-2.5 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                                            />
                                        </div>
                                        <Button 
                                            type="submit" 
                                            disabled={isParsing || !foodInput.trim()}
                                            className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-11"
                                        >
                                            {isParsing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                            {isParsing ? 'Analyzing...' : 'Log It'}
                                        </Button>
                                    </form>
                                </div>

                                {/* Food Log List */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 ml-1">Today's Log</h3>
                                    {logsLoading ? (
                                        <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                                    ) : nutritionLogs.length === 0 ? (
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center text-sm text-slate-500 shadow-sm border border-slate-100 dark:border-zinc-800">
                                            No food logged yet today.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(type => {
                                                const meals = nutritionLogs.filter(log => log.meal_type === type);
                                                if (meals.length === 0) return null;
                                                const typeCals = meals.reduce((sum, log) => sum + (log.calories || 0), 0);
                                                
                                                return (
                                                    <div key={type} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-zinc-800">
                                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2 mb-2">
                                                            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">{type}</h4>
                                                            <span className="text-xs font-bold text-slate-500">{typeCals} kcal</span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {meals.map(log => (
                                                                <div key={log.id} className="flex items-center justify-between group">
                                                                    <div className="min-w-0 pr-4">
                                                                        <p className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">{log.food_text}</p>
                                                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                                                            {log.calories} kcal • {log.protein}g P • {log.carbs}g C • {log.fats}g F
                                                                        </p>
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => { hapticLight(); deleteNutritionLog(log.id); }}
                                                                        className="p-2 text-rose-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-rose-50 dark:bg-rose-500/10 rounded-lg"
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
                        <PremiumGate feature="AI Meal Planning">
                            {/* If there is a generated plan that hasn't been saved yet, show it */}
                            {generatedPlan ? (
                                <MealPlanView 
                                    planData={generatedPlan} 
                                    date={selectedDate} 
                                    onLogEaten={handleLogEaten}
                                />
                            ) : plannedMeals?.length > 0 ? (
                                // Show saved plan for today
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 ml-1">Planned for Today</h3>
                                    {plannedMeals.map(meal => (
                                        <div key={meal.id} className={`bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-zinc-800 ${meal.is_logged ? 'opacity-50' : ''}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">{meal.meal_type}</span>
                                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{meal.meal_name}</h4>
                                                </div>
                                                <span className="text-sm font-bold bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300">
                                                    {meal.calories} kcal
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{meal.description}</p>
                                            <div className="flex justify-between items-end">
                                                <div className="flex gap-3 text-xs font-medium text-slate-500">
                                                    <span>P: {meal.protein}g</span>
                                                    <span>C: {meal.carbs}g</span>
                                                    <span>F: {meal.fats}g</span>
                                                </div>
                                                {!meal.is_logged && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
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
                                                        className="h-8 text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    >
                                                        Log It
                                                    </Button>
                                                )}
                                                {meal.is_logged && (
                                                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> Logged
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 text-center shadow-sm mt-4">
                                    <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mb-4">
                                        <CalendarDays className="w-8 h-8 text-violet-500" />
                                    </div>
                                    <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">No Plan Yet</h3>
                                    <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 mb-6 max-w-[250px] mx-auto">
                                        Generate a personalized, multi-day meal plan tailored to your macros.
                                    </p>
                                </div>
                            )}

                            {/* Floating Generate Button */}
                            <div className="fixed bottom-20 left-0 right-0 p-4 flex justify-center z-40 pointer-events-none">
                                <Button 
                                    onClick={() => { hapticLight(); setIsGeneratorOpen(true); }}
                                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full h-14 px-8 shadow-xl shadow-slate-900/20 flex items-center gap-2 font-semibold text-lg pointer-events-auto hover:scale-105 transition-transform"
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
                        </PremiumGate>
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
        </div>
    );
}
