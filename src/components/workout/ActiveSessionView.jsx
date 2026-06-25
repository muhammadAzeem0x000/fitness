import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Share2, Plus, Trophy } from 'lucide-react';
import { Button } from '../ui/Button';
import { ExerciseCard } from './ExerciseCard';
import { WorkoutDurationTimer } from './WorkoutDurationTimer';
import { ShareModal } from './ShareModal';
import { PostWorkoutSummary } from './PostWorkoutSummary';
import { AiSuggestionButton } from './AiSuggestionButton';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useBackInterceptor } from '../../hooks/useHardwareBackButton';
import { checkAndAwardAchievements } from '../../lib/wearables';
import { AchievementUnlockedToast } from '../ui/AchievementUnlockedToast';

export function ActiveSessionView({ routineName, initialExercises, onBack, onSave, onAddMore, defaultReps = 12, exerciseHistory = [] }) {
    const [activeExercises, setActiveExercises] = useState([]);
    const [loggedData, setLoggedData] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [workoutSummary, setWorkoutSummary] = useState('');
    
    // Save Template Feature States
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [finalDataToSave, setFinalDataToSave] = useState(null);
    
    // Post-workout summary
    const [showPostSummary, setShowPostSummary] = useState(false);
    const [savedWorkoutData, setSavedWorkoutData] = useState(null);
    const [unlockedAchievement, setUnlockedAchievement] = useState(null);
    
    const { toast } = useToast();
    const { user } = useAuth();

    useBackInterceptor(() => {
        if (showPostSummary) {
            setShowPostSummary(false);
            onBack();
            return;
        }
        if (showSaveTemplateModal) {
            setShowSaveTemplateModal(false);
            return;
        }
        if (showShareModal) {
            setShowShareModal(false);
            return;
        }
        // If they are deep in the workout, maybe go back to previous exercise instead of exiting completely?
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            return;
        }
        onBack();
    });

    const prevExercisesLength = React.useRef(initialExercises?.length || 0);

    // Initialize State and Handle Navigation for newly added exercises
    useEffect(() => {
        if (initialExercises && initialExercises.length > 0) {
            const prevLen = prevExercisesLength.current;
            if (prevLen > 0 && initialExercises.length > prevLen) {
                setCurrentIndex(prevLen);
            }
            prevExercisesLength.current = initialExercises.length;
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

        setSavedWorkoutData(dataToSave);
        
        onSave(dataToSave, { saveAsTemplate: false }).then(async () => {
            // Check for gamification achievements
            const newUnlocks = await checkAndAwardAchievements(user?.id, dataToSave, exerciseHistory);
            if (newUnlocks && newUnlocks.length > 0) {
                // For simplicity, just show the first one if multiple unlocked at once
                setUnlockedAchievement(newUnlocks[0]);
            }
        });
        
        setShowPostSummary(true);
    };

    const confirmFinish = (saveAsTemplate) => {
        if (saveAsTemplate && !newTemplateName.trim()) {
            toast.error("Please enter a template name");
            return;
        }
        setShowSaveTemplateModal(false);
        setSavedWorkoutData(finalDataToSave);
        
        onSave(finalDataToSave, { 
            saveAsTemplate, 
            newTemplateName: newTemplateName.trim() 
        }).then(async () => {
            const newUnlocks = await checkAndAwardAchievements(user?.id, finalDataToSave, exerciseHistory);
            if (newUnlocks && newUnlocks.length > 0) {
                setUnlockedAchievement(newUnlocks[0]);
            }
        });
        
        setShowPostSummary(true);
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
                    shared_by_name: user?.user_metadata?.full_name || user?.email || 'MuscleBot User',
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
        <div className="fixed top-[56px] left-0 right-0 bottom-0 z-[60] bg-white dark:bg-slate-900 flex justify-center animate-in slide-in-from-right-8 duration-500">
            <div className="w-full max-w-2xl h-full flex flex-col relative px-3 md:px-6 pb-2">
                {/* Header (Fixed) */}
            <div className="flex-none mb-4 space-y-3 border-b border-slate-200 dark:border-zinc-800/50 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{routineName}</h2>
                        </div>
                    </div>
                    {/* Finish button always visible when active exercises exist */}
                    {activeExercises.length > 0 && currentIndex < activeExercises.length && (
                        <Button variant="ghost" size="sm" onClick={() => setCurrentIndex(activeExercises.length)} className="text-emerald-600 dark:text-emerald-400 font-semibold h-8 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                            Finish
                        </Button>
                    )}
                </div>

                {/* Workout Duration Timer and Progress */}
                {activeExercises.length > 0 && (
                    <div className="flex flex-col items-center gap-2">
                        <WorkoutDurationTimer />
                        {currentIndex < activeExercises.length && (
                            <div className="flex gap-1 w-full max-w-[200px] justify-center mt-1">
                                {activeExercises.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`h-1.5 flex-1 rounded-full transition-colors ${idx === currentIndex ? 'bg-blue-500' : idx < currentIndex ? 'bg-blue-500/30' : 'bg-slate-200 dark:bg-zinc-800'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1 pb-32">
                {activeExercises.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-slate-300 dark:border-zinc-800 rounded-xl bg-slate-100 dark:bg-zinc-900/30 mt-8">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                            <Plus className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Ready to Workout?</h3>
                        <p className="text-slate-500 dark:text-zinc-500 text-sm mb-6 max-w-[250px]">
                            Add some exercises to start building your custom routine.
                        </p>
                        <Button onClick={onAddMore} className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 text-base font-semibold shadow-lg shadow-blue-900/20">
                            <Plus className="w-5 h-5 mr-2" /> Add Exercises
                        </Button>
                    </div>
                ) : currentIndex < activeExercises.length ? (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <ExerciseCard
                            key={activeExercises[currentIndex]}
                            exercise={activeExercises[currentIndex]}
                            onUpdateSets={handleUpdateExercise}
                            defaultReps={defaultReps}
                            exerciseHistory={exerciseHistory}
                            savedSets={loggedData[activeExercises[currentIndex]]}
                        />
                    </div>
                ) : (
                    // Finish Screen
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
                            <Trophy className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Great Job!</h2>
                        <p className="text-slate-500 dark:text-zinc-400 mb-8 max-w-[250px]">
                            You've crushed all your exercises. Ready to wrap it up?
                        </p>
                        
                        <div className="w-full max-w-sm space-y-3">
                            <Button
                                onClick={handleFinish}
                                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-900/20 text-lg font-bold rounded-2xl"
                            >
                                <Save className="w-5 h-5 mr-2" /> Save & Finish Workout
                            </Button>
                            
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    onAddMore();
                                }} 
                                className="w-full h-14 border-2 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 font-semibold rounded-2xl"
                            >
                                <Plus className="w-5 h-5 mr-2" /> Wait, Add More Exercises
                            </Button>

                            <Button variant="ghost" onClick={handleShare} className="w-full h-12 text-blue-600 dark:text-blue-400 font-semibold mt-4">
                                <Share2 className="w-4 h-4 mr-2" /> Share Workout Summary
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination Footer (Sticky) */}
            {activeExercises.length > 0 && currentIndex < activeExercises.length && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white dark:from-slate-900 dark:via-slate-900 to-transparent pt-12 pb-6 flex items-center justify-between gap-3 pointer-events-none">
                    <button 
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                        className="flex items-center justify-center h-14 w-16 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 active:bg-slate-200 dark:active:bg-zinc-700 disabled:opacity-30 pointer-events-auto shadow-md transition-colors"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-zinc-300" />
                    </button>
                    <Button 
                        onClick={() => setCurrentIndex(prev => prev + 1)}
                        className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-lg font-bold shadow-xl shadow-blue-900/20 pointer-events-auto"
                    >
                        {currentIndex === activeExercises.length - 1 ? 'Finish Exercises' : 'Next Exercise'}
                    </Button>
                </div>
            )}

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
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Save as Template?</h3>
                        <p className="text-slate-500 dark:text-zinc-400 text-sm mb-4">
                            You've built a custom workout. Do you want to save these exercises as a reusable Template for next time?
                        </p>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">Template Name</label>
                            <input
                                type="text"
                                placeholder="e.g., Back & Biceps"
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                className="w-full h-12 bg-slate-100 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
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

            {/* Post-Workout Summary */}
            <PostWorkoutSummary
                isOpen={showPostSummary}
                onClose={() => {
                    setShowPostSummary(false);
                    onBack();
                }}
                workoutData={savedWorkoutData}
                exerciseHistory={exerciseHistory}
            />

            {/* Gamification Toast */}
            <AchievementUnlockedToast 
                achievement={unlockedAchievement} 
                onClose={() => setUnlockedAchievement(null)} 
            />
            </div>
        </div>
    );
}
