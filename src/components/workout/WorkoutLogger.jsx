import React, { useState, useMemo, useEffect } from 'react';
import { EXERCISE_LIBRARY, SPLIT_OPTIONS } from '../../data/exerciseLibrary';
import { SplitSelector } from './SplitSelector';
import { ExerciseCard } from './ExerciseCard';
import { Button } from '../ui/Button';
import { Save, ArrowLeft, Share2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export function WorkoutLogger({ onSaveLog, history = [], routines = [] }) {
    const [selectedRoutine, setSelectedRoutine] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [scratchedExercises, setScratchedExercises] = useState({});
    const { toast } = useToast();

    // Find the last session for the selected routine/type
    const lastSession = useMemo(() => {
        if (!selectedRoutine || !history.length) return null;
        // Try to find match by Routine Name
        return history.find(log => log.type === selectedRoutine.name) || null;
    }, [selectedRoutine, history]);

    const activeExercises = useMemo(() => {
        if (!selectedRoutine) return [];
        if (selectedRoutine.exercises && selectedRoutine.exercises.length > 0) {
            return selectedRoutine.exercises;
        }
        if (selectedTemplate) {
            return EXERCISE_LIBRARY[selectedTemplate] || [];
        }
        return [];
    }, [selectedRoutine, selectedTemplate]);

    const handleRoutineSelect = (routine) => {
        setSelectedRoutine(routine);
        setSelectedTemplate(null);
        setScratchedExercises({});
    };

    const handleUpdateExercise = React.useCallback((exerciseName, setsData) => {
        setScratchedExercises(prev => ({
            ...prev,
            [exerciseName]: setsData
        }));
    }, []);

    const handleSave = () => {
        if (!selectedRoutine) return;

        onSaveLog({
            type: selectedRoutine.name,
            exercises: scratchedExercises,
            timestamp: new Date().toISOString()
        });

        toast.success("Workout Saved! Great job.");
        setSelectedRoutine(null);
        setSelectedTemplate(null);
        setScratchedExercises({});
    };

    const handleShare = async () => {
        if (!selectedRoutine || Object.keys(scratchedExercises).length === 0) {
            toast.error("Log some exercises first!");
            return;
        }

        let summary = `🔥 I just crushed a ${selectedRoutine.name} workout on SmartFit!\n\n`;

        Object.entries(scratchedExercises).forEach(([name, sets]) => {
            if (sets && sets.length > 0) {
                // Find best set or just list count
                const maxWeight = Math.max(...sets.map(s => Number(s.weight) || 0));
                summary += `💪 ${name}: ${sets.length} sets (Best: ${maxWeight}kg)\n`;
            }
        });

        summary += `\nJoin me on SmartFit!`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'My SmartFit Workout',
                    text: summary,
                });
            } else {
                await navigator.clipboard.writeText(summary);
                toast.success("Workout summary copied to clipboard!");
            }
        } catch (err) {
            console.error("Share failed:", err);
            // Fallback if share was cancelled or failed
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Log Workout</h2>
                {activeExercises.length > 0 && (
                    <div className="flex gap-2">
                        <Button type="button" variant="secondary" onClick={handleShare} className="gap-2">
                            <Share2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Share</span>
                        </Button>
                        <Button type="button" onClick={handleSave} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Save className="h-4 w-4" />
                            Finish Workout
                        </Button>
                    </div>
                )}
            </div>

            {/* Step 1: Select Routine (Day) */}
            <SplitSelector
                routines={routines}
                selectedRoutine={selectedRoutine}
                onSelect={handleRoutineSelect}
            />

            {/* Step 2: Select Template (If Routine has no exercises and no template selected) */}
            {selectedRoutine && activeExercises.length === 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-4 text-center">
                        <h3 className="text-lg font-medium text-white">Choose Workout Type</h3>
                        <p className="text-sm text-zinc-400">Select a template for your {selectedRoutine.name}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {SPLIT_OPTIONS.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => setSelectedTemplate(option)}
                                className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all text-sm font-medium"
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Log Exercises */}
            {selectedRoutine && activeExercises.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {selectedTemplate && (
                        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)} className="h-auto p-0 hover:bg-transparent text-zinc-400 hover:text-white">
                                <ArrowLeft className="w-3 h-3 mr-1" /> Change Type ({selectedTemplate})
                            </Button>
                        </div>
                    )}

                    <div className="grid gap-2 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {activeExercises.map((exercise) => {
                            // Extract last lookup for this specific exercise
                            const lastStats = lastSession?.exercises?.[exercise] || null;

                            return (
                                <ExerciseCard
                                    key={exercise}
                                    exercise={exercise}
                                    lastSession={lastStats}
                                    onUpdateSets={handleUpdateExercise}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {!selectedRoutine && (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 bg-zinc-900/20">
                    <p>Select a workout day above to start logging.</p>
                </div>
            )}
        </div>
    );
}
