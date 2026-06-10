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
import { ArrowLeft, Plus } from 'lucide-react';

export function WorkoutLogger({ onSaveLog, defaultReps = 12 }) {
    const { user } = useAuth();

    // Step 1: Routine (Template)
    const [selectedRoutine, setSelectedRoutine] = useState(null);
    const [isLogging, setIsLogging] = useState(false);
    
    // Step 2: Session Exercises
    const [selectedExercises, setSelectedExercises] = useState([]);
    const [showPicker, setShowPicker] = useState(false);

    // Data Fetching (no category filter)
    const { exercises, routines, workoutLogs, isLoading, addRoutine } = useWorkouts(user?.id);
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
                await addRoutine({ name: newTemplateName, exercises: templateExercises });
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

    // --- EXERCISE PICKER MODAL ---
    if (showPicker) {
        // Fallback: If DB is empty or failed to seed, use static defaults
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
                onComplete={(exercises) => {
                    setSelectedExercises(exercises);
                    setShowPicker(false);
                }}
                onBack={() => setShowPicker(false)}
            />
        );
    }

    // --- ACTIVE LOGGING SESSION ---
    if (isLogging && selectedRoutine) {
        return (
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
        );
    }



    // --- STEP 1: SELECT ROUTINE OR EMPTY WORKOUT ---
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pt-6 px-3 md:px-4 pb-20">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Log Workout</h2>
                <p className="text-zinc-400">Start a blank session or pick a saved template.</p>
            </div>

            <button
                onClick={handleStartEmpty}
                className="w-full p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-all text-left flex items-center justify-between group"
            >
                <div>
                    <h3 className="text-white font-medium text-lg">Start Empty Workout</h3>
                    <p className="text-sm text-blue-200/70">Build your session from scratch</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5 text-white" />
                </div>
            </button>

            <div className="pt-4 border-t border-zinc-800">
                <h3 className="text-lg font-semibold text-white mb-4">Your Templates</h3>
                <SplitSelector
                    routines={routines}
                    selectedRoutine={selectedRoutine}
                    onSelect={handleSelectRoutine}
                />
            </div>
        </div>
    );
}
