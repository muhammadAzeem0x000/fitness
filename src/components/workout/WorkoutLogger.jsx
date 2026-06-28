import React, { useState, useEffect } from 'react';
import { MuscleGroupGrid } from './MuscleGroupGrid';
import { ActiveSessionView } from './ActiveSessionView';
import { ExercisePicker } from './ExercisePicker';
import { AiWorkoutGenerator } from './AiWorkoutGenerator';
import { SplitSelector } from './SplitSelector'; // Restored
import { RoutineEditor } from './RoutineEditor';
import { PostWorkoutSummary } from './PostWorkoutSummary';
import { useWorkouts } from '../../hooks/useWorkouts';
import { seedExercises, DEFAULT_EXERCISES } from '../../lib/seeding';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { ArrowLeft, Plus, Sparkles, Clock, ChevronRight, Play, Info, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function WorkoutLogger({ onSaveLog, defaultReps = 12 }) {
    const { user } = useAuth();

    // Step 1: Routine (Template)
    const [selectedRoutine, setSelectedRoutine] = useState(null);
    const [isLogging, setIsLogging] = useState(false);
    
    // Step 2: Session Exercises
    const [selectedExercises, setSelectedExercises] = useState([]);
    
    // Template Management
    const [editingRoutine, setEditingRoutine] = useState(null);

    // Recent Workouts Actions
    const [selectedRecentWorkout, setSelectedRecentWorkout] = useState(null);
    const [viewWorkoutDetails, setViewWorkoutDetails] = useState(null);

    // AI Workout Generator
    const [showAiGenerator, setShowAiGenerator] = useState(false);
    const [showPicker, setShowPicker] = useState(false);

    // Data Fetching (no category filter)
    const { exercises, routines, workoutLogs, isLoading, addRoutine, deleteRoutine } = useWorkouts(user?.id);
    const { toast } = useToast();

    // Seeding Check
    useEffect(() => {
        const checkSeed = async () => {
            await seedExercises();
        };
        checkSeed();
    }, []);

    const handleSave = async (data, options = {}) => {
        const { saveAsTemplate, newTemplateName } = options;

        // 1. If saving as a template, insert into routines
        if (saveAsTemplate && newTemplateName) {
            try {
                // Extract exercise names from data.exercises
                const templateExercises = Object.keys(data.exercises).map(name => ({ name }));
                const source = selectedRoutine?.source || 'custom';
                await addRoutine({ name: newTemplateName, exercises: templateExercises, source });
                toast.success(`Template "${newTemplateName}" saved!`);
            } catch (err) {
                console.error("Failed to save template", err);
                toast.error("Failed to save template.");
            }
        }

        // 2. Save the workout log itself
        const finalData = {
            ...data,
            type: saveAsTemplate ? newTemplateName : data.type,
            routineId: selectedRoutine?.id,
            routineName: saveAsTemplate ? newTemplateName : selectedRoutine?.name
        };
        await onSaveLog(finalData);
        
        if (!saveAsTemplate) {
            toast.success("Workout Saved! Great job.");
        }

        // Reset Flow
        setIsLogging(false);
        setSelectedExercises([]);
        setSelectedRoutine(null);
        setShowPicker(false);
    };

    const handleAiWorkoutStart = (aiResult) => {
        setShowAiGenerator(false);
        setSelectedRoutine({ id: 'ai-generated', name: aiResult.name || 'AI Workout', source: 'ai' });
        setSelectedExercises(aiResult.exercises || []);
        setIsLogging(true);
    };

    const handleStartEmpty = () => {
        setSelectedRoutine({ id: 'custom', name: 'Custom Workout' });
        setSelectedExercises([]);
        setIsLogging(true);
    };

    const handleSelectRoutine = (routine) => {
        setSelectedRoutine(routine);
        // Extract just the exercise names from the routine's exercises JSON
        const exerciseNames = (routine.exercises || []).map(ex => typeof ex === 'string' ? ex : ex.name);
        setSelectedExercises(exerciseNames);
        setIsLogging(true);
    };

    const handleRepeatWorkout = (workout) => {
        setSelectedRoutine({
            id: 'custom',
            name: workout.routineName || workout.type,
            source: 'custom'
        });
        const exerciseNames = Object.keys(workout.exercises || {});
        setSelectedExercises(exerciseNames);
        setIsLogging(true);
    };

    const handleDeleteRoutine = async (id) => {
        if (window.confirm('Are you sure you want to delete this template?')) {
            try {
                await deleteRoutine(id);
                toast.success('Template deleted');
            } catch (e) {
                toast.error('Failed to delete template');
            }
        }
    };

    // --- AI WORKOUT GENERATOR ---
    if (showAiGenerator) {
        return (
            <AiWorkoutGenerator
                onStartWorkout={handleAiWorkoutStart}
                onClose={() => setShowAiGenerator(false)}
            />
        );
    }

    // --- ROUTINE EDITOR MODAL ---
    if (editingRoutine) {
        return (
            <RoutineEditor
                routine={editingRoutine}
                onClose={() => setEditingRoutine(null)}
                onSaveComplete={() => setEditingRoutine(null)}
            />
        );
    }

    // --- EXERCISE PICKER MODAL ---
    const renderPicker = () => {
        let availableExercises = exercises;
        if (!availableExercises || availableExercises.length === 0) {
            availableExercises = Object.entries(DEFAULT_EXERCISES).flatMap(([category, names]) =>
                names.map(name => ({ id: name, name, category }))
            );
        }

        return (
            <ExercisePicker
                availableExercises={availableExercises}
                initialSelection={selectedExercises}
                onComplete={(newExercises) => {
                    setSelectedExercises(newExercises);
                    setShowPicker(false);
                }}
                onBack={() => setShowPicker(false)}
            />
        );
    };

    if (showPicker && !isLogging) {
        return renderPicker();
    }

    // --- ACTIVE LOGGING SESSION ---
    if (isLogging && selectedRoutine) {
        return (
            <>
                <ActiveSessionView
                    routineName={selectedRoutine.name}
                    initialExercises={selectedExercises}
                    onBack={() => {
                        setIsLogging(false);
                        setSelectedRoutine(null);
                        setSelectedExercises([]);
                    }}
                    onSave={handleSave}
                    onAddMore={() => setShowPicker(true)}
                    defaultReps={defaultReps}
                    exerciseHistory={workoutLogs}
                />
                {showPicker && renderPicker()}
            </>
        );
    }

    const recentWorkouts = workoutLogs?.slice(0, 3) || [];

    // --- STEP 1: SELECT ROUTINE OR EMPTY WORKOUT ---
    return (
        <div className="space-y-8 animate-in fade-in duration-500 pt-6 px-3 md:px-4 pb-20">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Workout</h2>
                <p className="text-slate-500 dark:text-zinc-400">Log a session or create a new template.</p>
            </div>

            {/* Hero Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={handleStartEmpty}
                    className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all text-left group active:scale-95 touch-manipulation"
                >
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
                    <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-1">Start Empty</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-300/80 leading-tight">Blank session</p>
                </button>

                <button
                    onClick={() => setShowAiGenerator(true)}
                    className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 hover:border-violet-500/40 transition-all text-left group active:scale-95 touch-manipulation"
                >
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all" />
                    <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-1">AI Generate</h3>
                    <p className="text-sm text-violet-600 dark:text-violet-300/80 leading-tight">Smart plan</p>
                </button>
            </div>

            {/* Templates */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">My Templates</h3>
                </div>
                <SplitSelector
                    routines={routines}
                    selectedRoutine={selectedRoutine}
                    onSelect={handleSelectRoutine}
                    onEdit={setEditingRoutine}
                    onDelete={handleDeleteRoutine}
                    workoutLogs={workoutLogs}
                />
            </div>

            {/* Recent Workouts */}
            <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Recent Workouts</h3>
                <div className="space-y-3">
                    {recentWorkouts.length === 0 ? (
                        <div className="p-6 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-center text-slate-500 dark:text-zinc-500">
                            No workout history yet.
                        </div>
                    ) : (
                        recentWorkouts.map(log => {
                            const dateStr = formatDistanceToNow(new Date(log.date), { addSuffix: true });
                            let totalSets = 0;
                            Object.values(log.exercises || {}).forEach(sets => {
                                totalSets += Array.isArray(sets) ? sets.length : 0;
                            });

                            return (
                                <button
                                    key={log.id}
                                    onClick={() => setSelectedRecentWorkout(log)}
                                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors active:scale-95 touch-manipulation text-left"
                                >
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-lg">
                                            {log.routineName || log.type || 'Workout'}
                                        </h4>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-zinc-400">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {dateStr}
                                            </span>
                                            <span>·</span>
                                            <span>{Object.keys(log.exercises || {}).length} exercises</span>
                                            <span>·</span>
                                            <span>{totalSets} sets</span>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Recent Workout Action Drawer */}
            {selectedRecentWorkout && (
                <div className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                     onClick={() => setSelectedRecentWorkout(null)}
                >
                    <div className="bg-white dark:bg-zinc-900 w-full sm:w-96 rounded-t-3xl sm:rounded-3xl p-6 pb-safe animate-in slide-in-from-bottom duration-300"
                         onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                                    {selectedRecentWorkout.routineName || selectedRecentWorkout.type || 'Workout'}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-zinc-400">
                                    {formatDistanceToNow(new Date(selectedRecentWorkout.date), { addSuffix: true })}
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedRecentWorkout(null)}
                                className="p-2 -mr-2 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            <button 
                                onClick={() => {
                                    handleRepeatWorkout(selectedRecentWorkout);
                                    setSelectedRecentWorkout(null);
                                }}
                                className="w-full flex items-center justify-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all active:scale-95 touch-manipulation"
                            >
                                <Play className="w-5 h-5" />
                                Repeat Workout
                            </button>
                            <button 
                                onClick={() => {
                                    setViewWorkoutDetails(selectedRecentWorkout);
                                    setSelectedRecentWorkout(null);
                                }}
                                className="w-full flex items-center justify-center gap-2 p-4 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl font-semibold transition-all active:scale-95 touch-manipulation"
                            >
                                <Info className="w-5 h-5" />
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Post Workout Summary (Used as View Details here) */}
            {viewWorkoutDetails && (
                <PostWorkoutSummary
                    isOpen={!!viewWorkoutDetails}
                    onClose={() => setViewWorkoutDetails(null)}
                    workoutData={viewWorkoutDetails}
                    exerciseHistory={workoutLogs}
                />
            )}
        </div>
    );
}
