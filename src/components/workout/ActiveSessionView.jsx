import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Share2, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { ExerciseCard } from './ExerciseCard';
import { RestTimer } from './RestTimer';
import { WorkoutDurationTimer } from './WorkoutDurationTimer';
import { ShareModal } from './ShareModal';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export function ActiveSessionView({ routineName, initialExercises, onBack, onSave, onAddMore, defaultReps = 12, exerciseHistory = [] }) {
    const [activeExercises, setActiveExercises] = useState([]);
    const [loggedData, setLoggedData] = useState({});
    const [showRestTimer, setShowRestTimer] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [workoutSummary, setWorkoutSummary] = useState('');
    
    // Save Template Feature States
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [finalDataToSave, setFinalDataToSave] = useState(null);
    
    const { toast } = useToast();
    const { user } = useAuth();

    // Initialize State
    useEffect(() => {
        if (initialExercises && initialExercises.length > 0) {
            setActiveExercises(initialExercises);
        }
    }, [initialExercises]);

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

        const dataToSave = {
            type: routineName, // Save the routine name instead of a specific muscle group
            exercises: finalData,
            timestamp: new Date().toISOString()
        };

        if (routineName === 'Custom Workout') {
            setFinalDataToSave(dataToSave);
            setShowSaveTemplateModal(true);
            return;
        }

        onSave(dataToSave, { saveAsTemplate: false });
    };

    const confirmFinish = (saveAsTemplate) => {
        if (saveAsTemplate && !newTemplateName.trim()) {
            toast.error("Please enter a template name");
            return;
        }
        setShowSaveTemplateModal(false);
        onSave(finalDataToSave, { 
            saveAsTemplate, 
            newTemplateName: newTemplateName.trim() 
        });
    };

    const handleShare = async () => {
        // Build workout summary
        let summary = `🔥 ${routineName} Workout\n\n`;
        activeExercises.forEach(name => {
            if (loggedData[name]) {
                const sets = loggedData[name];
                const maxWeight = Math.max(...sets.map(s => Number(s.weight) || 0));
                summary += `💪 ${name}: ${sets.length} sets (Best: ${maxWeight}kg)\n`;
            }
        });

        try {
            // Try to save to database for shareable link
            const shareId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const { data, error } = await supabase
                .from('shared_workouts')
                .insert({
                    share_id: shareId,
                    workout_type: routineName,
                    exercises: loggedData,
                    shared_by_name: user?.user_metadata?.full_name || user?.email || 'SmartFit User',
                    user_id: user?.id
                })
                .select()
                .single();

            if (error) {
                // Fallback: Just copy to clipboard if database not set up
                console.log('Database not ready, copying to clipboard');
                await navigator.clipboard.writeText(summary);
                toast.success("📋 Workout copied to clipboard!");
                return;
            }

            // Success: Show share modal with link
            const url = `${window.location.origin}/share/${shareId}`;
            setShareUrl(url);
            setWorkoutSummary(summary);
            setShowShareModal(true);

        } catch (e) {
            console.error(e);
            // Final fallback - copy to clipboard
            try {
                await navigator.clipboard.writeText(summary);
                toast.success("📋 Workout copied to clipboard!");
            } catch (clipErr) {
                toast.error('Failed to share workout');
            }
        }
    };

    return (
        <div className="fixed top-[56px] left-0 right-0 bottom-0 z-40 bg-slate-900 flex flex-col px-3 md:px-6 pb-2 animate-in slide-in-from-right-8 duration-500">
            {/* Header (Fixed) */}
            <div className="flex-none mb-4 space-y-3 border-b border-zinc-800/50 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h2 className="text-xl font-bold text-white">{routineName}</h2>
                        </div>
                    </div>
                    {/* Share Button only here, Finish moved to footer */}
                    <Button variant="secondary" size="sm" onClick={handleShare} className="h-8">
                        <Share2 className="w-3.5 h-3.5 mr-1" /> Share
                    </Button>
                </div>

                {/* Workout Duration Timer */}
                <div className="flex justify-center">
                    <WorkoutDurationTimer />
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
                        return (
                            <ExerciseCard
                                key={name}
                                exercise={name}
                                onUpdateSets={handleUpdateExercise}
                                defaultReps={defaultReps}
                                exerciseHistory={exerciseHistory}
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
            <div className="flex-none pt-3 border-t border-zinc-800 bg-slate-900 mt-auto space-y-2">
                <Button
                    onClick={() => setShowRestTimer(!showRestTimer)}
                    variant="outline"
                    className="w-full"
                >
                    {showRestTimer ? 'Hide Rest Timer' : 'Start Rest Timer'}
                </Button>
                <Button
                    onClick={handleFinish}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 text-base font-semibold"
                >
                    <Save className="w-4 h-4 mr-2" /> Finish Workout
                </Button>
            </div>

            {/* Rest Timer */}
            {showRestTimer && <RestTimer onClose={() => setShowRestTimer(false)} />}

            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                shareUrl={shareUrl}
                workoutSummary={workoutSummary}
            />

            {/* Save Template Modal */}
            {showSaveTemplateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-white mb-2">Save as Template?</h3>
                        <p className="text-zinc-400 text-sm mb-4">
                            You've built a custom workout. Do you want to save these exercises as a reusable Template for next time?
                        </p>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Template Name</label>
                            <input
                                type="text"
                                placeholder="e.g., Back & Biceps"
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                                autoFocus
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => confirmFinish(true)}
                                disabled={!newTemplateName.trim()}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                            >
                                Save Template & Log
                            </Button>
                            <Button
                                onClick={() => confirmFinish(false)}
                                variant="outline"
                                className="w-full h-12"
                            >
                                Just Log Session
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
