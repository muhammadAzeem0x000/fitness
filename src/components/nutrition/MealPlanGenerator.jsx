import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Bot, Loader2, ListOrdered } from 'lucide-react';
import { generateMealPlan } from '../../lib/openai';

export function MealPlanGenerator({ targets }) {
    const [plan, setPlan] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [preferences, setPreferences] = useState('');

    const handleGenerate = async () => {
        if (!targets) return;
        setIsGenerating(true);
        try {
            const result = await generateMealPlan(targets, preferences);
            setPlan(result);
        } catch (error) {
            console.error(error);
            alert("Failed to generate meal plan. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!targets) return null;

    return (
        <Card className="border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 shadow-violet-500/5 mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                    <Bot className="w-5 h-5" />
                    AI Meal Planner
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!plan ? (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Let AI generate a perfect 1-day meal plan tailored to your target macros ({targets.calories} kcal).
                        </p>
                        <input
                            type="text"
                            placeholder="Optional: e.g. Vegetarian, no nuts, high protein breakfast..."
                            value={preferences}
                            onChange={(e) => setPreferences(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm"
                        />
                        <Button 
                            onClick={handleGenerate} 
                            disabled={isGenerating}
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ListOrdered className="w-4 h-4 mr-2" />}
                            {isGenerating ? 'Generating Plan...' : 'Generate Meal Plan'}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-4 gap-2 text-center text-sm font-medium">
                            <div className="bg-slate-100 dark:bg-zinc-800 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                                {plan.total_calories} kcal
                            </div>
                            <div className="bg-slate-100 dark:bg-zinc-800 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                                {plan.total_protein}g P
                            </div>
                            <div className="bg-slate-100 dark:bg-zinc-800 p-2 rounded-lg text-amber-600 dark:text-amber-400">
                                {plan.total_carbs}g C
                            </div>
                            <div className="bg-slate-100 dark:bg-zinc-800 p-2 rounded-lg text-rose-600 dark:text-rose-400">
                                {plan.total_fats}g F
                            </div>
                        </div>

                        <div className="space-y-4">
                            {plan.meals.map((meal, idx) => (
                                <div key={idx} className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-semibold text-slate-800 dark:text-slate-200">{meal.type}: {meal.name}</h4>
                                        <span className="text-xs font-bold bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">
                                            {meal.calories} kcal
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{meal.description}</p>
                                    <div className="flex gap-4 text-xs font-medium text-slate-500">
                                        <span>Protein: {meal.protein}g</span>
                                        <span>Carbs: {meal.carbs}g</span>
                                        <span>Fats: {meal.fats}g</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button variant="outline" className="w-full" onClick={() => setPlan(null)}>
                            Generate Another Plan
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
