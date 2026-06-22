import React, { useState } from 'react';
import { Button } from '../ui/Button';
import {
    Sparkles, Loader2, ArrowLeft, Play, Save, Clock, Dumbbell,
    Target, Zap, Heart, Flame, ChevronDown, ChevronUp,
    MessageSquare, LayoutGrid, AlertCircle, RotateCcw, Info
} from 'lucide-react';
import { generateWorkoutPlan } from '../../lib/openai';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useWorkouts } from '../../hooks/useWorkouts';
import { useWeight } from '../../hooks/useWeight';
import { useSubscription } from '../../hooks/useSubscription';
import { checkFeatureUsage, incrementFeatureUsage } from '../../lib/featureUsage';
import { useNavigate } from 'react-router-dom';
import { useBackInterceptor } from '../../hooks/useHardwareBackButton';
import { getExerciseDataBatch } from '../../lib/exerciseImages';
// Survey option definitions
const GOALS = [
    { id: 'strength', label: 'Strength', icon: Dumbbell, desc: 'Heavy weight, low reps' },
    { id: 'hypertrophy', label: 'Muscle Growth', icon: Zap, desc: 'Moderate weight, 8-12 reps' },
    { id: 'endurance', label: 'Endurance', icon: Heart, desc: 'Light weight, high reps' },
    { id: 'fat_loss', label: 'Fat Loss', icon: Flame, desc: 'Circuit-style, minimal rest' },
];

const MUSCLE_GROUPS = [
    { id: 'upper_body', label: 'Upper Body' },
    { id: 'lower_body', label: 'Lower Body' },
    { id: 'push', label: 'Push' },
    { id: 'pull', label: 'Pull' },
    { id: 'chest', label: 'Chest' },
    { id: 'back', label: 'Back' },
    { id: 'shoulders', label: 'Shoulders' },
    { id: 'arms', label: 'Arms' },
    { id: 'legs', label: 'Legs' },
    { id: 'full_body', label: 'Full Body' },
];

const DURATIONS = [
    { id: '30', label: '30 min', desc: 'Quick session' },
    { id: '45', label: '45 min', desc: 'Standard' },
    { id: '60', label: '60 min', desc: 'Full session' },
    { id: '90', label: '90 min', desc: 'Extended' },
];

const EQUIPMENT = [
    { id: 'full_gym', label: 'Full Gym', desc: 'All equipment available' },
    { id: 'dumbbells_only', label: 'Dumbbells', desc: 'Dumbbells + bench' },
    { id: 'bodyweight', label: 'Bodyweight', desc: 'No equipment' },
];

export function AiWorkoutGenerator({ onStartWorkout, onClose }) {
    const { user } = useAuth();
    const { profile } = useProfile(user?.id);
    const { workoutLogs, exercises } = useWorkouts(user?.id);
    const { weightHistory } = useWeight(user?.id);
    const { isPremium, isLoading: subLoading } = useSubscription();
    const navigate = useNavigate();

    // Mode: 'survey' or 'freetext'
    const [mode, setMode] = useState('survey');

    // Survey state
    const [selectedGoal, setSelectedGoal] = useState('');
    const [selectedMuscles, setSelectedMuscles] = useState('');
    const [selectedDuration, setSelectedDuration] = useState('60');
    const [selectedEquipment, setSelectedEquipment] = useState('full_gym');

    // Free text state
    const [freeText, setFreeText] = useState('');

    // Generation state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [showExerciseDetails, setShowExerciseDetails] = useState(true);

    useBackInterceptor(() => {
        if (generatedPlan) {
            setGeneratedPlan(null);
        } else {
            onClose();
        }
    });

    const canGenerate = mode === 'freetext'
        ? freeText.trim().length > 5
        : (selectedGoal && selectedMuscles);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);

        try {
            // Check quota for free users
            if (!isPremium) {
                const quota = await checkFeatureUsage(user.id, 'ai_workout_plan', 2, 30);
                if (!quota.allowed) {
                    const resetDate = quota.resetDate.toLocaleDateString();
                    setError(`Free tier limit reached (2 AI workout plans/month). Resets on ${resetDate}. Upgrade to Pro for unlimited!`);
                    setLoading(false);
                    return;
                }
            }

            // Get latest weight
            const latestWeight = weightHistory?.length > 0
                ? weightHistory[weightHistory.length - 1].weight
                : null;

            const plan = await generateWorkoutPlan({
                goal: mode === 'survey' ? selectedGoal : '',
                targetMuscles: mode === 'survey' ? selectedMuscles : '',
                duration: mode === 'survey' ? selectedDuration : '',
                equipment: mode === 'survey' ? selectedEquipment : '',
                freeText: mode === 'freetext' ? freeText : '',
                userProfile: {
                    displayName: profile?.display_name,
                    currentWeight: latestWeight || profile?.current_weight,
                    height: profile?.height,
                    targetWeight: profile?.goal_weight,
                },
                workoutHistory: workoutLogs || [],
            });

            // Map the AI-generated exercises back to our real 1300+ database exercises
            if (plan && plan.exercises) {
                const aiNames = plan.exercises.map(ex => ex.name);
                const batchMatches = await getExerciseDataBatch(aiNames);
                
                plan.exercises = plan.exercises.map(ex => {
                    const match = batchMatches.get(ex.name);
                    if (match) {
                        return {
                            ...ex,
                            name: match.display_name || match.name, // Use matched DB name
                            id: match.id,
                            thumbnail_url: match.image_url,
                            category: match.category || match.app_category,
                            equipment: match.equipment
                        };
                    }
                    return ex;
                });
            }

            setGeneratedPlan(plan);

            // Increment usage for free users
            if (!isPremium) {
                await incrementFeatureUsage(user.id, 'ai_workout_plan');
            }
        } catch (err) {
            console.error('AI Workout Generation Error:', err);
            setError(err.message || 'Failed to generate workout plan');
        } finally {
            setLoading(false);
        }
    };

    const handleStartWorkout = () => {
        if (!generatedPlan) return;

        const exerciseNames = generatedPlan.exercises.map(ex => ex.name);
        onStartWorkout({
            name: generatedPlan.planName || 'AI Workout',
            exercises: exerciseNames,
            aiPlan: generatedPlan, // Pass full plan for reference
        });
    };

    // --- RESULTS VIEW ---
    if (generatedPlan) {
        return (
            <div className="fixed top-[56px] left-0 right-0 bottom-0 z-[60] bg-slate-50 dark:bg-slate-900 flex flex-col animate-in fade-in duration-300">
                {/* Header */}
                <div className="flex-none px-4 py-4 border-b border-slate-200 dark:border-zinc-800/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={() => setGeneratedPlan(null)} className="h-8 w-8">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                                    {generatedPlan.planName}
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{generatedPlan.summary}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Plan Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-4">
                    {/* Meta Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-500 dark:text-zinc-500 uppercase tracking-wide font-medium">Duration</p>
                                <p className="text-slate-900 dark:text-white font-semibold text-sm">{generatedPlan.estimatedDuration || '~60 min'}</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center">
                                <Dumbbell className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-500 dark:text-zinc-500 uppercase tracking-wide font-medium">Exercises</p>
                                <p className="text-slate-900 dark:text-white font-semibold text-sm">{generatedPlan.exercises.length} exercises</p>
                            </div>
                        </div>
                    </div>

                    {/* Coach Tip */}
                    {generatedPlan.coachTip && (
                        <div className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20 rounded-xl p-4 flex gap-3">
                            <Sparkles className="w-5 h-5 text-violet-500 dark:text-violet-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-violet-600 dark:text-violet-300 uppercase tracking-wide mb-1">Coach Tip</p>
                                <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">{generatedPlan.coachTip}</p>
                            </div>
                        </div>
                    )}

                    {/* Exercise List */}
                    <div>
                        <button
                            onClick={() => setShowExerciseDetails(!showExerciseDetails)}
                            className="flex items-center justify-between w-full mb-3"
                        >
                            <h3 className="text-sm font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Workout Plan</h3>
                            {showExerciseDetails ? <ChevronUp className="w-4 h-4 text-slate-500 dark:text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-slate-500 dark:text-zinc-500" />}
                        </button>

                        {showExerciseDetails && (
                            <div className="space-y-2">
                                {generatedPlan.exercises.map((ex, i) => (
                                    <div
                                        key={i}
                                        className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 flex items-start gap-4 group hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
                                    >
                                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden relative group-hover:ring-2 ring-violet-500/50 transition-all">
                                            {ex.thumbnail_url ? (
                                                <img src={ex.thumbnail_url} alt={ex.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Dumbbell className="w-5 h-5 text-slate-400 dark:text-zinc-500" />
                                            )}
                                            <div className="absolute top-0 right-0 bg-black/60 text-white text-[10px] font-bold px-1 rounded-bl-lg">
                                                {i + 1}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="text-slate-900 dark:text-white font-medium text-sm leading-tight">{ex.name}</h4>
                                                {ex.id && (
                                                    <button onClick={() => window.open(`/exercises/${ex.id}`, '_blank')} className="text-slate-400 hover:text-violet-500 transition-colors">
                                                        <Info className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600 dark:text-zinc-400">
                                                <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{ex.sets} sets</span>
                                                <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{ex.reps} reps</span>
                                                {ex.restSeconds && (
                                                    <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{ex.restSeconds}s rest</span>
                                                )}
                                            </div>
                                            {ex.notes && (
                                                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-2 italic flex items-start gap-1.5">
                                                    <Info className="w-3 h-3 mt-0.5 shrink-0 text-slate-400 dark:text-zinc-600" />
                                                    {ex.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex-none px-4 py-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-slate-900 space-y-2">
                    <Button
                        onClick={handleStartWorkout}
                        className="w-full h-12 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-900/25 text-base font-semibold gap-2"
                    >
                        <Play className="w-5 h-5" /> Start This Workout
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setGeneratedPlan(null)}
                            className="flex-1 gap-2 text-sm"
                        >
                            <RotateCcw className="w-4 h-4" /> Regenerate
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 text-sm"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // --- GENERATOR INPUT VIEW ---
    return (
        <div className="fixed top-[56px] left-0 right-0 bottom-0 z-[60] bg-slate-50 dark:bg-slate-900 flex flex-col animate-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex-none px-4 py-4 border-b border-slate-200 dark:border-zinc-800/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                                AI Workout Builder
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                Describe your workout or use quick options
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mode Tabs */}
                <div className="flex mt-4 p-1 bg-white dark:bg-zinc-900/80 rounded-xl gap-1 border border-slate-200 dark:border-zinc-800">
                    <button
                        onClick={() => setMode('survey')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                            mode === 'survey'
                                ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
                        }`}
                    >
                        <LayoutGrid className={`w-4 h-4 ${mode === 'survey' ? 'text-violet-400' : ''}`} />
                        Quick Options
                    </button>
                    <button
                        onClick={() => setMode('freetext')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                            mode === 'freetext'
                                ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
                        }`}
                    >
                        <MessageSquare className={`w-4 h-4 ${mode === 'freetext' ? 'text-violet-400' : ''}`} />
                        Describe It
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-6">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm">{error}</p>
                            {error.includes('Upgrade') && (
                                <button
                                    onClick={() => navigate('/pricing')}
                                    className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                                >
                                    View Pro Plans →
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {mode === 'survey' ? (
                    <>
                        {/* Goal Selection */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-zinc-300 mb-3 uppercase tracking-wider">
                                What's your goal?
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {GOALS.map(g => {
                                    const Icon = g.icon;
                                    const isActive = selectedGoal === g.id;
                                    return (
                                        <button
                                            key={g.id}
                                            onClick={() => setSelectedGoal(g.id)}
                                            className={`p-3.5 rounded-xl border text-left transition-all ${
                                                isActive
                                                    ? 'border-violet-500 bg-violet-500/10 shadow-sm shadow-violet-500/10'
                                                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                                            }`}
                                        >
                                            <Icon className={`w-5 h-5 mb-2 ${isActive ? 'text-violet-500 dark:text-violet-400' : 'text-slate-500 dark:text-zinc-500'}`} />
                                            <p className={`font-medium text-sm ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-zinc-300'}`}>{g.label}</p>
                                            <p className="text-[11px] text-slate-500 dark:text-zinc-500 mt-0.5">{g.desc}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Target Muscles */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-zinc-300 mb-3 uppercase tracking-wider">
                                Target Muscles
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {MUSCLE_GROUPS.map(m => {
                                    const isActive = selectedMuscles === m.id;
                                    return (
                                        <button
                                            key={m.id}
                                            onClick={() => setSelectedMuscles(m.id)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                                isActive
                                                    ? 'bg-violet-600 dark:bg-violet-500 text-white shadow-lg shadow-violet-500/25 border border-violet-600 dark:border-violet-500'
                                                    : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-700 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-700'
                                            }`}
                                        >
                                            {m.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Duration */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-zinc-300 mb-3 uppercase tracking-wider">
                                Time Available
                            </h3>
                            <div className="grid grid-cols-4 gap-2">
                                {DURATIONS.map(d => {
                                    const isActive = selectedDuration === d.id;
                                    return (
                                        <button
                                            key={d.id}
                                            onClick={() => setSelectedDuration(d.id)}
                                            className={`p-3 rounded-xl border text-center transition-all ${
                                                isActive
                                                    ? 'border-violet-500 bg-violet-500/10'
                                                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-slate-50 dark:hover:bg-zinc-800'
                                            }`}
                                        >
                                            <p className={`font-bold text-sm ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-zinc-300'}`}>{d.label}</p>
                                            <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-0.5">{d.desc}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Equipment */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-zinc-300 mb-3 uppercase tracking-wider">
                                Equipment
                            </h3>
                            <div className="grid grid-cols-3 gap-2">
                                {EQUIPMENT.map(e => {
                                    const isActive = selectedEquipment === e.id;
                                    return (
                                        <button
                                            key={e.id}
                                            onClick={() => setSelectedEquipment(e.id)}
                                            className={`p-3 rounded-xl border text-center transition-all ${
                                                isActive
                                                    ? 'border-violet-500 bg-violet-500/10'
                                                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-slate-50 dark:hover:bg-zinc-800'
                                            }`}
                                        >
                                            <p className={`font-medium text-sm ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-zinc-300'}`}>{e.label}</p>
                                            <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-0.5">{e.desc}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                ) : (
                    /* Free Text Mode */
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-zinc-300 mb-3 uppercase tracking-wider">
                                Describe Your Ideal Workout
                            </h3>
                            <textarea
                                value={freeText}
                                onChange={(e) => setFreeText(e.target.value)}
                                placeholder="e.g., &quot;I want a chest and triceps workout. I have 45 minutes and my shoulder is a bit sore so avoid overhead pressing. Focus on hypertrophy.&quot;"
                                className="w-full h-40 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-xl p-4 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all resize-none"
                                autoFocus
                            />
                            <p className="text-xs text-slate-500 dark:text-zinc-600 mt-2">
                                Be specific about your goals, injuries, available equipment, and time constraints.
                            </p>
                        </div>

                        {/* Quick Prompt Suggestions */}
                        <div>
                            <p className="text-xs text-zinc-500 mb-2 font-medium">Quick prompts:</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    "Quick upper body pump, 30 minutes",
                                    "Heavy leg day with squats and deadlifts",
                                    "Full body workout for a beginner",
                                    "Arms and shoulders, focus on size",
                                    "Fat burning circuit with minimal rest",
                                ].map((prompt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setFreeText(prompt)}
                                        className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-full text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 transition-colors"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Free tier indicator */}
                {!isPremium && !subLoading && (
                    <div className="text-xs text-slate-500 dark:text-zinc-500 text-center px-2 py-3 bg-slate-100 dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-zinc-800">
                        Free tier: 2 AI workout plans/month
                        <button
                            onClick={() => navigate('/pricing')}
                            className="ml-2 text-violet-400 hover:text-violet-300 underline"
                        >
                            Upgrade for unlimited
                        </button>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex-none px-4 py-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-slate-900">
                <Button
                    onClick={handleGenerate}
                    disabled={!canGenerate || loading}
                    className="w-full h-12 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-900/25 text-base font-semibold gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating your plan...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            Generate Workout Plan
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
