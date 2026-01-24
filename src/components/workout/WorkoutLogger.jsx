import React, { useState } from 'react';
import { EXERCISE_LIBRARY } from '../../data/exerciseLibrary';
import { SplitSelector } from './SplitSelector';
import { ExerciseCard } from './ExerciseCard';
import { Button } from '../ui/Button';
import { Save } from 'lucide-react';

export function WorkoutLogger({ onSaveLog }) {
    const [selectedSplit, setSelectedSplit] = useState(null);
    const [exercises, setExercises] = useState({}); // { "Bench Press": [{weight, reps}, ...] }

    const handleSplitSelect = (split) => {
        setSelectedSplit(split);
        // Reset exercises or load template? For now reset.
        setExercises({});
    };

    const handleSave = () => {
        if (!selectedSplit) return;
        onSaveLog({
            type: selectedSplit,
            exercises: exercises,
            timestamp: new Date().toISOString()
        });
        // Reset or show success
        setSelectedSplit(null);
        setExercises({});
        alert("Workout Saved!");
    };

    const currentExercises = selectedSplit ? EXERCISE_LIBRARY[selectedSplit] : [];

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Log Workout</h2>
                {selectedSplit && (
                    <Button onClick={handleSave} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Save className="h-4 w-4" />
                        Finish Workout
                    </Button>
                )}
            </div>

            <SplitSelector selectedSplit={selectedSplit} onSelect={handleSplitSelect} />

            {selectedSplit && (
                <div className="grid gap-2 md:gap-4 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {currentExercises.map((exercise) => (
                        <ExerciseCard
                            key={exercise}
                            exercise={exercise}
                            sets={[]} // Passing empty for now, state handled inside or lifted?
                            // Ideally lifted to setExercises, but for UI mvp leaving loose
                            onUpdateSets={() => { }}
                        />
                    ))}
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
