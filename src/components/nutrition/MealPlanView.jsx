import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Calendar, Plus, CheckCircle2, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { hapticLight, hapticSuccess } from '../../lib/haptics';
import { useMealPlan } from '../../hooks/useMealPlan';
import { useAuth } from '../../hooks/useAuth';

export function MealPlanView({ planData, date, onLogEaten }) {
    const { user } = useAuth();
    const { savePlanToDb, isSaving, plannedMeals } = useMealPlan(user?.id, date);
    const [expandedDays, setExpandedDays] = useState([0]); // Expand first day by default
    const [savedState, setSavedState] = useState(false);

    if (!planData || !planData.days) return null;

    const toggleDay = (index) => {
        hapticLight();
        setExpandedDays(prev => 
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleSavePlan = async () => {
        hapticLight();
        
        // Flatten all meals across all days into an array of records
        const mealsToSave = [];
        planData.days.forEach((dayData, dayIndex) => {
            // Calculate actual date for this day offset
            const mealDate = new Date(date);
            mealDate.setDate(mealDate.getDate() + dayIndex);
            const dateStr = mealDate.toISOString().split('T')[0];

            dayData.meals.forEach(meal => {
                mealsToSave.push({
                    date: dateStr,
                    type: meal.type,
                    name: meal.name,
                    description: meal.description,
                    calories: meal.calories,
                    protein: meal.protein,
                    carbs: meal.carbs,
                    fats: meal.fats
                });
            });
        });

        try {
            await savePlanToDb(mealsToSave);
            hapticSuccess();
            setSavedState(true);
        } catch (error) {
            console.error("Error saving plan:", error);
            alert("Failed to save meal plan");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-zinc-800">
                <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                        {planData.days.length}-Day Meal Plan
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Avg ~{planData.days[0].meals.reduce((sum, m) => sum + m.calories, 0)} kcal/day
                    </p>
                </div>
                <Button 
                    onClick={handleSavePlan}
                    disabled={isSaving || savedState}
                    variant={savedState ? "outline" : "default"}
                    className={savedState ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-900/50" : "bg-violet-600 text-white"}
                >
                    {isSaving ? "Saving..." : savedState ? <><Check className="w-4 h-4 mr-1" /> Saved</> : "Save Plan to Tracker"}
                </Button>
            </div>

            <div className="space-y-3">
                {planData.days.map((dayData, dayIndex) => {
                    const isExpanded = expandedDays.includes(dayIndex);
                    
                    const dayDate = new Date(date);
                    dayDate.setDate(dayDate.getDate() + dayIndex);
                    const dateDisplay = dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    
                    const dayTotalCals = dayData.meals.reduce((sum, m) => sum + m.calories, 0);

                    return (
                        <div key={dayIndex} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                            <button 
                                onClick={() => toggleDay(dayIndex)}
                                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-400">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-slate-800 dark:text-slate-200">Day {dayIndex + 1}</div>
                                        <div className="text-xs text-slate-500 dark:text-zinc-400">{dateDisplay}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-slate-600 dark:text-zinc-300">{dayTotalCals} kcal</span>
                                    {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                                </div>
                            </button>
                            
                            {isExpanded && (
                                <div className="p-4 pt-0 space-y-3 bg-slate-50 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-800">
                                    {dayData.meals.map((meal, mIndex) => (
                                        <Card key={mIndex} className="border-0 shadow-sm bg-white dark:bg-slate-900 mt-3">
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">{meal.type}</span>
                                                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{meal.name}</h4>
                                                    </div>
                                                    <span className="text-sm font-bold bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300">
                                                        {meal.calories} kcal
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">{meal.description}</p>
                                                
                                                <div className="flex justify-between items-end">
                                                    <div className="flex gap-3 text-xs font-medium text-slate-500">
                                                        <span>P: {meal.protein}g</span>
                                                        <span>C: {meal.carbs}g</span>
                                                        <span>F: {meal.fats}g</span>
                                                    </div>
                                                    
                                                    {dayIndex === 0 && (
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="h-8 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                                                            onClick={() => onLogEaten(meal)}
                                                        >
                                                            <CheckCircle2 className="w-3 h-3 mr-1" /> Log Eaten
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
