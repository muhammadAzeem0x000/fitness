import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import { History, Trophy, CheckCircle2, Check, Info, X, Plus, Layers } from 'lucide-react';
import Confetti from 'react-confetti';
import { useToast } from '../../context/ToastContext';
import { VideoGuideModal } from './VideoGuideModal';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { PlayCircle } from 'lucide-react';
import { getExerciseData, formatEquipment, formatTarget } from '../../lib/exerciseImages';

export function ExerciseCard({ exercise, lastSession, onUpdateSets, defaultReps = 12, exerciseHistory = [], savedSets = null }) {
    const { toast } = useToast();
    const [showConfetti, setShowConfetti] = useState(false);
    const [prSetIndex, setPrSetIndex] = useState(null);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

    // Track which sets the user has actually touched/modified
    const [touchedSets, setTouchedSets] = useState(() => {
        if (savedSets && savedSets.length > 0) {
            return new Set(savedSets.map((_, i) => i));
        }
        return new Set();
    });
    const [exerciseImgData, setExerciseImgData] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Find the most recent session for this specific exercise
    const getDerivedLastSession = () => {
        if (lastSession) return lastSession;
        if (!exerciseHistory || exerciseHistory.length === 0) return null;
        for (const log of exerciseHistory) {
            if (log.exercises && log.exercises[exercise]) {
                return log.exercises[exercise];
            }
        }
        return null;
    };

    const actualLastSession = getDerivedLastSession();

    // Initialize 3 sets by default, pre-filling from history if available
    const [sets, setSets] = useState(() => {
        if (savedSets && savedSets.length > 0) {
            return savedSets;
        }

        const initialSets = [];
        for (let i = 0; i < 2; i++) {
            if (actualLastSession && actualLastSession[i]) {
                initialSets.push({
                    weight: actualLastSession[i].weight || '',
                    reps: actualLastSession[i].reps || defaultReps,
                    type: actualLastSession[i].type || 'normal'
                });
            } else {
                initialSets.push({ weight: '', reps: defaultReps, type: 'normal' });
            }
        }
        return initialSets;
    });

    const addSet = (type = 'normal') => {
        setSets(prev => [...prev, { weight: '', reps: defaultReps, type }]);
    };

    const removeSet = (indexToRemove) => {
        setSets(prev => prev.filter((_, i) => i !== indexToRemove));
        setTouchedSets(prev => {
            const newTouched = new Set();
            prev.forEach(i => {
                if (i < indexToRemove) newTouched.add(i);
                if (i > indexToRemove) newTouched.add(i - 1);
            });
            return newTouched;
        });
    };

    // Calculate historical max weight and reps for this exercise
    const getHistoricalMaxes = () => {
        if (!exerciseHistory || exerciseHistory.length === 0) return { maxWeight: 0, maxRepsAtMaxWeight: 0 };

        let maxWeight = 0;
        let maxRepsAtMaxWeight = 0;

        exerciseHistory.forEach(log => {
            const exerciseData = log.exercises?.[exercise];
            if (exerciseData && Array.isArray(exerciseData)) {
                exerciseData.forEach(set => {
                    const weight = parseFloat(set.weight) || 0;
                    const reps = parseInt(set.reps) || 0;
                    if (weight > maxWeight) {
                        maxWeight = weight;
                        maxRepsAtMaxWeight = reps;
                    } else if (weight === maxWeight && reps > maxRepsAtMaxWeight) {
                        maxRepsAtMaxWeight = reps;
                    }
                });
            }
        });

        return { maxWeight, maxRepsAtMaxWeight };
    };

    const { maxWeight: historicalMax, maxRepsAtMaxWeight: historicalMaxReps } = getHistoricalMaxes();
    const [sessionMaxWeight, setSessionMaxWeight] = useState(historicalMax);
    const [sessionMaxReps, setSessionMaxReps] = useState(historicalMaxReps);

    useEffect(() => {
        setSessionMaxWeight(historicalMax);
        setSessionMaxReps(historicalMaxReps);
    }, [historicalMax, historicalMaxReps]);

    // Lift state up whenever local state changes
    useEffect(() => {
        onUpdateSets(exercise, sets);
    }, [sets, onUpdateSets, exercise]);

    // Load exercise image data
    useEffect(() => {
        getExerciseData(exercise).then(data => {
            setExerciseImgData(data);
        });
    }, [exercise]);

    const updateSet = (index, field, value) => {
        const newSets = [...sets];
        newSets[index] = { ...newSets[index], [field]: value };
        setSets(newSets);

        // Mark this set as touched by the user
        setTouchedSets(prev => new Set(prev).add(index));
    };

    const handleBlur = (index) => {
        const set = sets[index];
        const weight = parseFloat(set.weight) || 0;
        const reps = parseInt(set.reps) || 0;
        
        if (weight <= 0) return;

        let isPR = false;
        let prMessage = '';

        if (weight > sessionMaxWeight) {
            isPR = true;
            prMessage = `🏆 New Weight PR set for ${exercise}!`;
            setSessionMaxWeight(weight);
            setSessionMaxReps(reps);
        } else if (weight === sessionMaxWeight && reps > sessionMaxReps) {
            isPR = true;
            prMessage = `🏆 New Reps PR set for ${exercise}!`;
            setSessionMaxReps(reps);
        }

        if (isPR) {
            setPrSetIndex(index);
            setShowConfetti(true);
            toast.success(prMessage);

            // Stop confetti after 3 seconds
            setTimeout(() => {
                setShowConfetti(false);
            }, 3000);
        }
    };

    // Confirm a set without changing values
    const confirmSet = (index) => {
        setTouchedSets(prev => new Set(prev).add(index));
    };

    // Helper to format last session text
    const getLastBestSet = () => {
        if (!actualLastSession || !Array.isArray(actualLastSession)) return "New Exercise";
        const bestSet = actualLastSession.reduce((max, set) => {
            const w = parseFloat(set.weight) || 0;
            const currentMax = parseFloat(max.weight) || 0;
            return w > currentMax ? set : max;
        }, { weight: 0, reps: 0 });

        if (bestSet.weight === 0) return "No data";
        return `${bestSet.weight}kg x ${bestSet.reps}`;
    };

    return (
        <>
            {showConfetti && (
                <Confetti
                    recycle={false}
                    numberOfPieces={200}
                    gravity={0.3}
                    style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999 }}
                />
            )}

            <Card className="mb-4 border-0 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl shadow-xl ring-1 ring-slate-200 dark:ring-white/10 rounded-3xl overflow-hidden">
                <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2.5">
                            {/* Exercise Thumbnail */}
                            {exerciseImgData?.image_url ? (
                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-none border border-slate-200 dark:border-zinc-700">
                                    <img
                                        src={exerciseImgData.image_url}
                                        alt={exercise}
                                        className="w-full h-full object-cover hd-image"
                                        loading="lazy"
                                    />
                                </div>
                            ) : null}
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-200">{exercise}</h4>
                                    <button
                                        onClick={() => setIsVideoModalOpen(true)}
                                        className="text-slate-400 dark:text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-1"
                                        title="Watch Video Guide"
                                    >
                                        <PlayCircle className="w-4 h-4" />
                                    </button>
                                    {exerciseImgData && (
                                        <button
                                            onClick={() => setIsDetailModalOpen(true)}
                                            className="text-slate-400 dark:text-zinc-500 hover:text-purple-500 dark:hover:text-purple-400 transition-colors p-1"
                                            title="View exercise details & form guide"
                                        >
                                            <Info className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                {exerciseImgData && (
                                    <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                                        {formatTarget(exerciseImgData.target)}{exerciseImgData.equipment ? ` • ${formatEquipment(exerciseImgData.equipment)}` : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                            {actualLastSession && (
                                <div className="flex items-center gap-1 text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20" title="Last Session Best">
                                    <History className="h-3 w-3" />
                                    <span>Last: {getLastBestSet()}</span>
                                </div>
                            )}
                            {historicalMax > 0 && (
                                <div className="flex items-center gap-1 text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20" title="All-Time Best">
                                    <Trophy className="h-3 w-3" />
                                    <span>PR: {historicalMax}kg</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {sets.map((set, index) => {
                            const isComplete = set.weight && set.reps && touchedSets.has(index);
                            const hasValues = set.weight && set.reps;
                            const canConfirm = hasValues && !touchedSets.has(index);

                            return (
                                <div key={index} className={`flex gap-3 items-center p-2 rounded-xl border ${set.type === 'superset' ? 'bg-orange-500/5 border-orange-500/20' : 'bg-slate-50 dark:bg-zinc-900/40 border-transparent'} transition-all ${isComplete ? 'opacity-100' : 'opacity-80'}`}>
                                    <div className="flex flex-col items-center justify-center w-8 shrink-0">
                                        <span className="text-sm font-bold font-mono text-slate-500 dark:text-zinc-400">{index + 1}</span>
                                        {set.type === 'superset' && <span className="text-[9px] font-bold text-orange-500 uppercase tracking-wider mt-0.5">SS</span>}
                                    </div>

                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                            <span className="text-xs text-slate-400 font-medium">kg</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={set.weight}
                                            onChange={(e) => updateSet(index, 'weight', e.target.value)}
                                            onBlur={() => handleBlur(index)}
                                            className={`w-full h-11 rounded-lg border ${prSetIndex === index ? 'border-yellow-500 ring-2 ring-yellow-500/50' : 'border-slate-200 dark:border-zinc-800'} bg-white dark:bg-zinc-950 pl-8 pr-2 text-base text-center font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all`}
                                        />
                                        {prSetIndex === index && set.weight && (
                                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg animate-bounce flex items-center gap-1">
                                                <Trophy className="h-3 w-3" />
                                                PR!
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                            <span className="text-xs text-slate-400 font-medium">reps</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={set.reps}
                                            onChange={(e) => updateSet(index, 'reps', e.target.value)}
                                            onBlur={() => handleBlur(index)}
                                            className="w-full h-11 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-9 pr-2 text-base text-center font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                                        />
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => removeSet(index)}
                                            className="p-2 text-slate-400 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                                            title="Remove set"
                                            type="button"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                        
                                        {/* Confirm button or checkmark */}
                                        {canConfirm ? (
                                            <button
                                                onClick={() => confirmSet(index)}
                                                className="p-2 bg-slate-200 dark:bg-zinc-800 hover:bg-green-500 hover:text-white dark:hover:bg-green-500 text-slate-600 dark:text-zinc-400 rounded-lg transition-all shadow-sm"
                                                title="Confirm set"
                                                type="button"
                                            >
                                                <Check className="w-5 h-5" />
                                            </button>
                                        ) : isComplete ? (
                                            <div className="p-2 w-9 flex items-center justify-center">
                                                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 animate-fade-in" />
                                            </div>
                                        ) : (
                                            <div className="w-9 h-9" /> // Spacer
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Add Set Buttons */}
                    <div className="mt-5 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => addSet('normal')}
                            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add Set
                        </button>
                        <button
                            type="button"
                            onClick={() => addSet('superset')}
                            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-semibold text-sm hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                        >
                            <Layers className="w-4 h-4" /> Add Superset
                        </button>
                    </div>
                </CardContent>
            </Card>

            <VideoGuideModal 
                isOpen={isVideoModalOpen}
                onClose={() => setIsVideoModalOpen(false)}
                exerciseName={exercise}
            />

            <ExerciseDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                exerciseName={exercise}
            />
        </>
    );
}
