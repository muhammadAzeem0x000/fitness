import React, { useState, useMemo } from 'react';
import { EXERCISE_LIBRARY } from '../../data/exerciseLibrary';
import { SplitSelector } from './SplitSelector';
import { ExerciseCard } from './ExerciseCard';
import { Button } from '../ui/Button';
import { Save } from 'lucide-react';

export function WorkoutLogger({ onSaveLog, history = [] }) {
    const [selectedSplit, setSelectedSplit] = useState(null);
    const [scratchedExercises, setScratchedExercises] = useState({});

    // Find the last session for the selected split
    const lastSession = useMemo(() => {
        if (!selectedSplit || !history.length) return null;
        return history.find(log => log.type === selectedSplit);
    }, [selectedSplit, history]);

    const handleSplitSelect = (split) => {
        setSelectedSplit(split);
        setScratchedExercises({});
    };

    const handleUpdateExercise = React.useCallback((exerciseName, setsData) => {
        setScratchedExercises(prev => ({
            ...prev,
            [exerciseName]: setsData
        }));
    }, []);

    const handleSave = () => {
        if (!selectedSplit) return;
        onSaveLog({
            type: selectedSplit,
            exercises: scratchedExercises,
            timestamp: new Date().toISOString()
        });
        setSelectedSplit(null);
        setScratchedExercises({});
        alert("Workout Saved! Great job.");
    };

    const currentExercises = selectedSplit ? EXERCISE_LIBRARY[selectedSplit] : [];

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Log Workout</h2>
                {selectedSplit && (
                    <Button type="button" onClick={handleSave} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Save className="h-4 w-4" />
                        Finish Workout
                    </Button>
                )}
            </div>

            <SplitSelector selectedSplit={selectedSplit} onSelect={handleSplitSelect} />

            {selectedSplit && (
                <div className="grid gap-2 md:gap-4 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {currentExercises.map((exercise) => {
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
            )}

            {!selectedSplit && (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500">
                    <p>Select a split pattern above to start logging.</p>
                </div>
            )}
        </div>
    );
}
