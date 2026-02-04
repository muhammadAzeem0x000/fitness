import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import { History, Trophy } from 'lucide-react';
import Confetti from 'react-confetti';
import { useToast } from '../../context/ToastContext';

export function ExerciseCard({ exercise, lastSession, onUpdateSets, defaultReps = 12, exerciseHistory = [] }) {
    const { toast } = useToast();
    const [showConfetti, setShowConfetti] = useState(false);
    const [prSetIndex, setPrSetIndex] = useState(null);

    // Initialize 3 sets by default, pre-filling from history if available
    const [sets, setSets] = useState(() => {
        const initialSets = [];
        for (let i = 0; i < 3; i++) {
            if (lastSession && lastSession[i]) {
                initialSets.push({
                    weight: lastSession[i].weight || '',
                    reps: lastSession[i].reps || defaultReps
                });
            } else {
                initialSets.push({ weight: '', reps: defaultReps });
            }
        }
        return initialSets;
    });

    // Calculate historical max weight for this exercise
    const getHistoricalMaxWeight = () => {
        if (!exerciseHistory || exerciseHistory.length === 0) return 0;

        let maxWeight = 0;
        exerciseHistory.forEach(log => {
            const exerciseData = log.exercises?.[exercise];
            if (exerciseData && Array.isArray(exerciseData)) {
                exerciseData.forEach(set => {
                    const weight = parseFloat(set.weight) || 0;
                    if (weight > maxWeight) {
                        maxWeight = weight;
                    }
                });
            }
        });

        return maxWeight;
    };

    // Check if current weight is a new PR
    const checkForPR = (currentWeight) => {
        if (!currentWeight) return false;
        const weight = parseFloat(currentWeight);
        if (isNaN(weight) || weight <= 0) return false;

        const historicalMax = getHistoricalMaxWeight();
        return weight > historicalMax;
    };

    // Lift state up whenever local state changes
    useEffect(() => {
        onUpdateSets(exercise, sets);
    }, [sets, onUpdateSets, exercise]);

    const updateSet = (index, field, value) => {
        const newSets = [...sets];
        newSets[index] = { ...newSets[index], [field]: value };
        setSets(newSets);

        // Check for PR on weight change
        if (field === 'weight' && value) {
            const isPR = checkForPR(value);
            if (isPR) {
                setPrSetIndex(index);
                setShowConfetti(true);
                toast.success(`🏆 New 1RM Record set for ${exercise}!`);

                // Stop confetti after 3 seconds
                setTimeout(() => {
                    setShowConfetti(false);
                }, 3000);
            }
        }
    };

    // Helper to format last session text
    const getLastBestSet = () => {
        if (!lastSession || !Array.isArray(lastSession)) return "New Exercise";
        const bestSet = lastSession.reduce((max, set) => {
            const w = parseFloat(set.weight) || 0;
            const currentMax = parseFloat(max.weight) || 0;
            return w > currentMax ? set : max;
        }, { weight: 0, reps: 0 });

        if (bestSet.weight === 0) return "No data";
        return `${bestSet.weight}kg x ${bestSet.reps}`;
    };

    const historicalMax = getHistoricalMaxWeight();

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
                        <h4 className="text-lg font-semibold text-slate-200">{exercise}</h4>
                        <div className="flex flex-col gap-1 items-end">
                            {lastSession && (
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
                        {sets.map((set, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <span className="text-xs font-mono text-zinc-500 w-8 shrink-0">#{index + 1}</span>

                                <div className="relative w-1/2">
                                    <input
                                        type="number"
                                        placeholder="kg"
                                        value={set.weight}
                                        onChange={(e) => updateSet(index, 'weight', e.target.value)}
                                        className={`w-full h-9 rounded-md border ${prSetIndex === index ? 'border-yellow-500 ring-2 ring-yellow-500/50' : 'border-zinc-800'} bg-zinc-950 px-2 text-sm text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500`}
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
                                    className="w-1/2 h-9 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-sm text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                                />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
