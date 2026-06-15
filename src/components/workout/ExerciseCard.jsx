import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import { History, Trophy, CheckCircle2, Check } from 'lucide-react';
import Confetti from 'react-confetti';
import { useToast } from '../../context/ToastContext';
import { VideoGuideModal } from './VideoGuideModal';
import { PlayCircle } from 'lucide-react';

export function ExerciseCard({ exercise, lastSession, onUpdateSets, defaultReps = 12, exerciseHistory = [] }) {
    const { toast } = useToast();
    const [showConfetti, setShowConfetti] = useState(false);
    const [prSetIndex, setPrSetIndex] = useState(null);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

    // Track which sets the user has actually touched/modified
    const [touchedSets, setTouchedSets] = useState(new Set());

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
        const initialSets = [];
        for (let i = 0; i < 3; i++) {
            if (actualLastSession && actualLastSession[i]) {
                initialSets.push({
                    weight: actualLastSession[i].weight || '',
                    reps: actualLastSession[i].reps || defaultReps
                });
            } else {
                initialSets.push({ weight: '', reps: defaultReps });
            }
        }
        return initialSets;
    });

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

            <Card className="mb-4 border-l-4 border-l-blue-500 bg-zinc-900/50">
                <CardContent className="pt-4 pb-4">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                            <h4 className="text-lg font-semibold text-slate-200">{exercise}</h4>
                            <button
                                onClick={() => setIsVideoModalOpen(true)}
                                className="text-zinc-500 hover:text-blue-400 transition-colors p-1"
                                title="Watch Video Guide"
                            >
                                <PlayCircle className="w-4 h-4" />
                            </button>
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

                    <div className="space-y-2">
                        {sets.map((set, index) => {
                            const isComplete = set.weight && set.reps && touchedSets.has(index);
                            const hasValues = set.weight && set.reps;
                            const canConfirm = hasValues && !touchedSets.has(index);

                            return (
                                <div key={index} className={`flex gap-2 items-center transition-opacity ${isComplete ? 'opacity-100' : 'opacity-70'}`}>
                                    <span className="text-xs font-mono text-zinc-500 w-8 shrink-0">#{index + 1}</span>

                                    <div className="relative w-1/2">
                                        <input
                                            type="number"
                                            placeholder="kg"
                                            value={set.weight}
                                            onChange={(e) => updateSet(index, 'weight', e.target.value)}
                                            onBlur={() => handleBlur(index)}
                                            className={`w-full h-9 rounded-md border ${prSetIndex === index ? 'border-yellow-500 ring-2 ring-yellow-500/50' : 'border-zinc-800'} bg-zinc-950 px-2 text-sm text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 input-glow`}
                                        />
                                        {prSetIndex === index && set.weight && (
                                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg animate-bounce flex items-center gap-1">
                                                <Trophy className="h-3 w-3" />
                                                PR!
                                            </div>
                                        )}
                                    </div>

                                    <input
                                        type="number"
                                        placeholder="reps"
                                        value={set.reps}
                                        onChange={(e) => updateSet(index, 'reps', e.target.value)}
                                        onBlur={() => handleBlur(index)}
                                        className="w-1/2 h-9 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-sm text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 input-glow"
                                    />

                                    {/* Confirm button or checkmark */}
                                    {canConfirm ? (
                                        <button
                                            onClick={() => confirmSet(index)}
                                            className="p-2 hover:bg-zinc-800 rounded transition-all border border-zinc-700 hover:border-green-500/50 group"
                                            title="Confirm set with these values"
                                            type="button"
                                        >
                                            <Check className="w-5 h-5 text-zinc-500 group-hover:text-green-500 transition-colors" />
                                        </button>
                                    ) : isComplete ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 animate-fade-in" />
                                    ) : (
                                        <div className="w-9 h-9" /> // Spacer
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            <VideoGuideModal 
                isOpen={isVideoModalOpen}
                onClose={() => setIsVideoModalOpen(false)}
                exerciseName={exercise}
            />
        </>
    );
}
