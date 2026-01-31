import React, { useState, useEffect } from 'react';
import { MuscleGroupGrid } from './MuscleGroupGrid';
import { ActiveSessionView } from './ActiveSessionView';
import { ExercisePicker } from './ExercisePicker';
import { SplitSelector } from './SplitSelector'; // Restored
import { useWorkouts } from '../../hooks/useWorkouts';
import { seedExercises, DEFAULT_EXERCISES } from '../../lib/seeding';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { ArrowLeft } from 'lucide-react';

export function WorkoutLogger({ onSaveLog }) {
    const { user } = useAuth();

    // Step 1: Routine
    const [selectedRoutine, setSelectedRoutine] = useState(null);
    // Step 2: Category
    const [selectedCategory, setSelectedCategory] = useState(null);
    // Step 3: Picker
    const [selectedExercises, setSelectedExercises] = useState([]);
    const [isLogging, setIsLogging] = useState(false);

    // Data Fetching
    const { exercises, routines, lastWorkoutByType, isLoading } = useWorkouts(user?.id, selectedCategory);
    const { toast } = useToast();

    // Seeding Check
    useEffect(() => {
        const checkSeed = async () => {
            await seedExercises();
        };
        checkSeed();
    }, []);

    const handleSave = async (data) => {
        // Enriched data with Routine Name if available
        const finalData = {
            ...data,
            routineId: selectedRoutine?.id,
            routineName: selectedRoutine?.name
        };
        await onSaveLog(finalData);
        toast.success("Workout Saved! Great job.");

        // Reset Flow
        setIsLogging(false);
        setSelectedExercises([]);
        setSelectedCategory(null);
        setSelectedRoutine(null);
    };

    // --- STEP 4: LOGGING ---
    if (isLogging && selectedCategory) {
        return (
            <ActiveSessionView
                category={selectedCategory}
                initialExercises={selectedExercises}
                lastWorkout={lastWorkoutByType}
                onBack={() => setIsLogging(false)}
                onSave={handleSave}
                onAddMore={() => setIsLogging(false)} // Go back to picker to add more
            />
        );
    }

    // --- STEP 3: PICK EXERCISES ---
    if (selectedCategory) {
        // Filter exercises by category
        let categoryExercises = exercises.filter(ex => ex.category === selectedCategory);

        // Fallback: If DB is empty or failed to seed, usage static defaults
        if (categoryExercises.length === 0 && DEFAULT_EXERCISES[selectedCategory]) {
            categoryExercises = DEFAULT_EXERCISES[selectedCategory].map(name => ({
                id: name, // Usage name as ID for static items
                name,
                category: selectedCategory
            }));
        }

        return (
            <ExercisePicker
                category={selectedCategory}
                availableExercises={categoryExercises}
                onComplete={(exercises) => {
                    setSelectedExercises(exercises);
                    setIsLogging(true);
                }}
                onBack={() => setSelectedCategory(null)}
            />
        );
    }

    // --- STEP 2: SELECT MUSCLE GROUP ---
    if (selectedRoutine) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedRoutine(null)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Target Muscle Group</h2>
                        <p className="text-zinc-400">What are you training for {selectedRoutine.name}?</p>
                    </div>
                </div>

                <MuscleGroupGrid onSelect={setSelectedCategory} />
            </div>
        );
    }

    // --- STEP 1: SELECT ROUTINE (DAY) ---
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Log Workout</h2>
                <p className="text-zinc-400">Select your current split day to begin.</p>
            </div>

            <SplitSelector
                routines={routines}
                selectedRoutine={selectedRoutine}
                onSelect={setSelectedRoutine}
            />
        </div>
    );
}
