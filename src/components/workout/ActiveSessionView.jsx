import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Share2, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { ExerciseCard } from './ExerciseCard';
import { useToast } from '../../context/ToastContext';

export function ActiveSessionView({ category, initialExercises, lastWorkout, onBack, onSave, onAddMore }) {
    const [activeExercises, setActiveExercises] = useState([]);
    const [loggedData, setLoggedData] = useState({});
    const { toast } = useToast();

    // Initialize State
    useEffect(() => {
        if (initialExercises && initialExercises.length > 0) {
            setActiveExercises(initialExercises);
        } else if (lastWorkout && lastWorkout.exercises) {
            // Fallback to last workout if no explicit selection (though flow dictates selection)
            setActiveExercises(Object.keys(lastWorkout.exercises));
        }
    }, [initialExercises, lastWorkout]);

    const handleUpdateExercise = (name, sets) => {
        setLoggedData(prev => ({
            ...prev,
            [name]: sets
        }));
    };

    const handleFinish = () => {
        if (activeExercises.length === 0) {
            toast.error("Add some exercises first!");
            return;
        }

        // Filter loggedData to only include activeExercises
        const finalData = {};
        activeExercises.forEach(name => {
            if (loggedData[name] && loggedData[name].length > 0) {
                finalData[name] = loggedData[name];
            }
        });

        if (Object.keys(finalData).length === 0) {
            toast.error("Log at least one set!");
            return;
        }

        onSave({
            type: category, // The Muscle Group Name
            exercises: finalData,
            timestamp: new Date().toISOString()
        });
    };

    const handleShare = async () => {
        let summary = `🔥 ${category} Workout on SmartFit!\n\n`;
        activeExercises.forEach(name => {
            if (loggedData[name]) {
                const sets = loggedData[name];
                const maxWeight = Math.max(...sets.map(s => Number(s.weight) || 0));
                summary += `💪 ${name}: ${sets.length} sets(Best: ${maxWeight}) \n`;
            }
        });

        try {
            if (navigator.share) {
                await navigator.share({ title: 'Workout', text: summary });
            } else {
                await navigator.clipboard.writeText(summary);
                toast.success("Copied to clipboard");
            }
        } catch (e) { console.error(e); }
    };

    return (
        <div className="flex flex-col h-[calc(100dvh-6rem)] md:h-[calc(100dvh-8rem)] animate-in slide-in-from-right-8 duration-500">
            {/* Header (Fixed) */}
            <div className="flex-none mb-4 space-y-2 border-b border-zinc-800/50 pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h2 className="text-xl font-bold text-white">{category}</h2>
                            <p className="text-zinc-500 text-xs">
                                {lastWorkout ? `Last: ${new Date(lastWorkout.date).toLocaleDateString()} ` : 'First time logging this!'}
                            </p>
                        </div>
                    </div>
                    {/* Share Button only here, Finish moved to footer */}
                    <Button variant="secondary" size="sm" onClick={handleShare} className="h-8">
                        <Share2 className="w-3.5 h-3.5 mr-1" /> Share
                    </Button>
                </div>
            </div>

            {/* Active List (Scrollable) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1 pb-4 min-h-0 space-y-4">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {activeExercises.length === 0 && (
                        <div className="col-span-full text-center py-12 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">
                            Add exercises using the manager below to start logging.
                        </div>
                    )}

                    {activeExercises.map(name => {
                        const lastStats = lastWorkout?.exercises?.[name] || null;
                        return (
                            <ExerciseCard
                                key={name}
                                exercise={name}
                                lastSession={lastStats}
                                onUpdateSets={handleUpdateExercise}
                            />
                        );
                    })}
                </div>

                {/* Add More Button (Bottom of list) */}
                <div className="flex justify-center pt-2">
                    <Button variant="outline" size="sm" onClick={onAddMore} className="border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 w-full md:w-auto text-xs">
                        <Plus className="w-3 h-3 mr-2" /> Add More Exercises
                    </Button>
                </div>
            </div>

            {/* Footer Action (Fixed) */}
            <div className="flex-none pt-3 border-t border-zinc-800 bg-slate-900/95 backdrop-blur-sm -mx-1 px-1 mt-auto">
                <Button
                    onClick={handleFinish}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 text-base font-semibold"
                >
                    <Save className="w-4 h-4 mr-2" /> Finish Workout
                </Button>
            </div>
        </div>
    );
}
