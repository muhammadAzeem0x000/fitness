import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Trophy, TrendingUp, TrendingDown, Dumbbell, Flame, X, Sparkles, Loader2, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';

/**
 * Post-Workout Summary Modal
 * Shows an AI-generated breakdown after saving a workout.
 * Falls back to a quick stats summary if AI fails or is skipped.
 */
export function PostWorkoutSummary({ isOpen, onClose, workoutData, exerciseHistory = [] }) {
    const navigate = useNavigate();
    const [aiSummary, setAiSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (!isOpen || !workoutData) return;
        computeStats();
    }, [isOpen, workoutData]);

    const computeStats = () => {
        if (!workoutData?.exercises) {
            setLoading(false);
            return;
        }

        const exercises = workoutData.exercises;
        let totalSets = 0;
        let totalReps = 0;
        let totalVolume = 0;
        let exerciseCount = 0;
        let heaviestLift = { name: '', weight: 0 };
        const newPRs = [];

        // Current session analysis
        Object.entries(exercises).forEach(([name, sets]) => {
            exerciseCount++;
            if (Array.isArray(sets)) {
                sets.forEach(set => {
                    totalSets++;
                    const weight = parseFloat(set.weight) || 0;
                    const reps = parseFloat(set.reps) || 0;
                    totalReps += reps;
                    totalVolume += weight * reps;
                    if (weight > heaviestLift.weight) {
                        heaviestLift = { name, weight };
                    }
                });
            }
        });

        // Check for PRs by comparing to history
        Object.entries(exercises).forEach(([name, sets]) => {
            if (!Array.isArray(sets)) return;
            const currentMax = Math.max(...sets.map(s => parseFloat(s.weight) || 0));
            if (currentMax <= 0) return;

            // Find historical max for this exercise
            let historicalMax = 0;
            exerciseHistory.forEach(log => {
                const histExercise = log.exercises?.[name];
                if (histExercise && Array.isArray(histExercise)) {
                    histExercise.forEach(s => {
                        const w = parseFloat(s.weight) || 0;
                        if (w > historicalMax) historicalMax = w;
                    });
                }
            });

            if (currentMax > historicalMax && historicalMax > 0) {
                newPRs.push({ name, weight: currentMax, previous: historicalMax });
            }
        });

        // Compare to last session of same type
        let volumeChange = null;
        const lastSameType = exerciseHistory.find(l => l.type === workoutData.type);
        if (lastSameType?.exercises) {
            let lastVolume = 0;
            const lastEx = lastSameType.exercises;
            if (typeof lastEx === 'object' && !Array.isArray(lastEx)) {
                Object.values(lastEx).forEach(sets => {
                    if (Array.isArray(sets)) {
                        sets.forEach(s => {
                            lastVolume += (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0);
                        });
                    }
                });
            }
            if (lastVolume > 0) {
                volumeChange = ((totalVolume - lastVolume) / lastVolume * 100).toFixed(1);
            }
        }

        setStats({
            exerciseCount,
            totalSets,
            totalReps,
            totalVolume: Math.round(totalVolume),
            heaviestLift,
            newPRs,
            volumeChange,
            workoutType: workoutData.type || 'Workout',
        });

        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-950 border border-zinc-800 rounded-t-3xl md:rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-8 md:slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="flex-none p-5 pb-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Workout Complete!</h2>
                                <p className="text-xs text-zinc-400">{stats?.workoutType}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                            <X className="w-5 h-5 text-zinc-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-5 space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                        </div>
                    ) : stats ? (
                        <>
                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Exercises</p>
                                    <p className="text-2xl font-bold text-white mt-1">{stats.exerciseCount}</p>
                                </div>
                                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Total Sets</p>
                                    <p className="text-2xl font-bold text-white mt-1">{stats.totalSets}</p>
                                </div>
                                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Total Volume</p>
                                    <p className="text-xl font-bold text-white mt-1">{stats.totalVolume.toLocaleString()}<span className="text-sm text-zinc-400 ml-1">kg</span></p>
                                </div>
                                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Total Reps</p>
                                    <p className="text-2xl font-bold text-white mt-1">{stats.totalReps}</p>
                                </div>
                            </div>

                            {/* Volume Comparison */}
                            {stats.volumeChange !== null && (
                                <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${
                                    parseFloat(stats.volumeChange) >= 0
                                        ? 'bg-emerald-500/5 border-emerald-500/20'
                                        : 'bg-orange-500/5 border-orange-500/20'
                                }`}>
                                    {parseFloat(stats.volumeChange) >= 0 ? (
                                        <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
                                    ) : (
                                        <TrendingDown className="w-5 h-5 text-orange-400 shrink-0" />
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            {parseFloat(stats.volumeChange) >= 0 ? '+' : ''}{stats.volumeChange}% volume vs last {stats.workoutType}
                                        </p>
                                        <p className="text-xs text-zinc-500">Compared to your previous session of this type</p>
                                    </div>
                                </div>
                            )}

                            {/* Heaviest Lift */}
                            {stats.heaviestLift.weight > 0 && (
                                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                                    <Dumbbell className="w-5 h-5 text-blue-400 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            Heaviest lift: {stats.heaviestLift.name}
                                        </p>
                                        <p className="text-xs text-zinc-400">{stats.heaviestLift.weight} kg</p>
                                    </div>
                                </div>
                            )}

                            {/* New PRs */}
                            {stats.newPRs.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Trophy className="w-3.5 h-3.5" />
                                        New Personal Records!
                                    </h4>
                                    {stats.newPRs.map((pr, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                                            <Flame className="w-4 h-4 text-yellow-400 shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-white">{pr.name}</p>
                                                <p className="text-xs text-zinc-400">
                                                    {pr.previous}kg → <span className="text-yellow-400 font-semibold">{pr.weight}kg</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* AI Summary (if loaded) */}
                            {aiSummary && (
                                <div className="bg-gradient-to-r from-violet-500/5 to-blue-500/5 border border-violet-500/20 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-4 h-4 text-violet-400" />
                                        <p className="text-xs font-semibold text-violet-300 uppercase tracking-wider">AI Analysis</p>
                                    </div>
                                    <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-strong:text-white">
                                        <ReactMarkdown>{aiSummary}</ReactMarkdown>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-center text-zinc-500 py-8">No workout data to summarize.</p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex-none p-5 pt-0 space-y-2">
                    <Button
                        onClick={onClose}
                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                        Done
                    </Button>
                    <button
                        onClick={() => { onClose(); navigate('/dashboard'); }}
                        className="w-full flex items-center justify-center gap-1 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                        View Dashboard <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
