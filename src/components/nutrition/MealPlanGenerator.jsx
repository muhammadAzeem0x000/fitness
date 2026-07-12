import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Loader2, X } from 'lucide-react';
import { generateMealPlan } from '../../lib/openai';
import { hapticLight, hapticSuccess } from '../../lib/haptics';

export function MealPlanGenerator({ isOpen, onClose, onGenerated, targets, foodHistory }) {
    const [isGenerating, setIsGenerating] = useState(false);

    // Form state
    const [days, setDays] = useState(1);
    const [goal, setGoal] = useState('Balance');
    const [diet, setDiet] = useState('Standard');
    const [exclusions, setExclusions] = useState([]);
    const [mealsPerDay, setMealsPerDay] = useState(4);
    const [cuisine, setCuisine] = useState('Any');
    const [complexity, setComplexity] = useState('Quick & Easy');

    const toggleExclusion = (item) => {
        hapticLight();
        setExclusions(prev =>
            prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
        );
    };

    const handleGenerate = async () => {
        if (!targets) return;
        setIsGenerating(true);
        hapticLight();

        try {
            const limit = isPremium ? 2 : 1;
            const period = isPremium ? 1 : 30;
            const quota = await checkFeatureUsage(user.id, 'ai_meal_plan', limit, period);
            if (!quota.allowed) {
                const resetDate = quota.resetDate.toLocaleDateString();
                const errorMsg = isPremium
                    ? `You've reached your Premium limit of 2 AI meal plans today. Your limit resets tomorrow.`
                    : `You've reached your free limit of 1 AI meal plan this month. Your limit resets on ${resetDate}.`;
                toast.error(errorMsg);
                setIsGenerating(false);
                return;
            }

            const result = await generateMealPlan({
                targets,
                goal,
                diet,
                exclusions,
                mealsPerDay,
                cuisine,
                complexity,
                days,
                foodHistory
            });
            await incrementFeatureUsage(user.id, 'ai_meal_plan');
            hapticSuccess();
            onGenerated(result); // Pass back up to save or display
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to generate meal plan. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    const ALLERGIES = ['Nuts', 'Dairy', 'Gluten', 'Shellfish', 'Eggs', 'Soy'];
    const DIETS = ['Standard', 'Vegetarian', 'Vegan', 'Keto', 'Paleo'];

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end justify-center h-[100dvh]">
                {/* Click outside to close */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm" 
                    onClick={onClose} 
                />

                {/* Bottom Sheet */}
                <motion.div 
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, { offset, velocity }) => {
                        if (offset.y > 100 || velocity.y > 500) {
                            onClose();
                        }
                    }}
                    className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl p-6 pb-safe max-h-[90dvh] flex flex-col z-10"
                >
                    <div className="flex justify-center mb-6 shrink-0">
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full" />
                    </div>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="text-xl">✨</span> Generate Meal Plan
                    </h2>
                    <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto hide-scrollbar pb-6">
                    {/* Duration */}
                    <div>
                        <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-3 block">Duration</label>
                        <div className="flex gap-2 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
                            {[1, 7].map(num => (
                                <button
                                    key={num}
                                    onClick={() => { hapticLight(); setDays(num); }}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${days === num
                                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-500 dark:text-zinc-400'
                                        }`}
                                >
                                    {num === 1 ? '1 Day' : '1 Week'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Target Goal */}
                    <div>
                        <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-3 block">Target</label>
                        <div className="flex flex-wrap gap-2">
                            {['Weight Loss', 'Fat Loss', 'Balance', 'Muscle Gain', 'Weight Gain'].map(g => (
                                <button
                                    key={g}
                                    onClick={() => { hapticLight(); setGoal(g); }}
                                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${goal === g
                                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300'
                                            : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-800'
                                        }`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Diet Type */}
                    <div>
                        <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-3 block">Diet Type</label>
                        <div className="flex flex-wrap gap-2">
                            {DIETS.map(d => (
                                <button
                                    key={d}
                                    onClick={() => { hapticLight(); setDiet(d); }}
                                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${diet === d
                                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300'
                                            : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-800'
                                        }`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Exclusions */}
                    <div>
                        <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-3 block">Exclude (Allergies)</label>
                        <div className="flex flex-wrap gap-2">
                            {ALLERGIES.map(item => (
                                <button
                                    key={item}
                                    onClick={() => toggleExclusion(item)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors flex items-center gap-1 ${exclusions.includes(item)
                                            ? 'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300'
                                            : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-800'
                                        }`}
                                >
                                    {exclusions.includes(item) && <X className="w-3 h-3" />}
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Meals Per Day */}
                    <div>
                        <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-3 block">Meals per day</label>
                        <div className="flex gap-2">
                            {[2, 3, 4, 5].map(num => (
                                <button
                                    key={num}
                                    onClick={() => { hapticLight(); setMealsPerDay(num); }}
                                    className={`flex-1 py-2 text-sm font-medium border rounded-xl transition-colors ${mealsPerDay === num
                                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300'
                                            : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-800'
                                        }`}
                                >
                                    {num} Meals
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cooking Complexity */}
                    <div>
                        <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-3 block">Cooking Complexity</label>
                        <div className="flex gap-2">
                            {['Quick & Easy', 'Moderate', 'Chef Mode'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => { hapticLight(); setComplexity(c); }}
                                    className={`flex-1 py-2 text-xs font-medium border rounded-xl transition-colors ${complexity === c
                                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300'
                                            : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-800'
                                        }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white h-14 rounded-xl text-lg font-semibold shadow-lg shadow-violet-500/20"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                ✨ Generate {days === 1 ? 'Day' : 'Week'} Plan
                            </>
                        )}
                    </Button>
                </div>
            </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
