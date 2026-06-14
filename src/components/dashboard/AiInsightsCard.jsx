import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Flame, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

/**
 * AI-Powered Dashboard Insights Widget
 * Generates smart, contextual insights based on user's recent activity data.
 * Uses local computation (no API call) for instant, reliable insights.
 */
export function AiInsightsCard({ workoutLogs = [], weightHistory = [], profile = {} }) {
    const [currentInsightIdx, setCurrentInsightIdx] = useState(0);

    const insights = useMemo(() => {
        const result = [];
        const now = new Date();

        // --- Workout Frequency Analysis ---
        const last7Days = workoutLogs.filter(w => {
            const d = new Date(w.date);
            return (now - d) / (1000 * 60 * 60 * 24) <= 7;
        });
        const last14Days = workoutLogs.filter(w => {
            const d = new Date(w.date);
            const diff = (now - d) / (1000 * 60 * 60 * 24);
            return diff > 7 && diff <= 14;
        });

        if (last7Days.length > last14Days.length && last7Days.length >= 3) {
            result.push({
                icon: Flame,
                color: 'text-emerald-400',
                bg: 'from-emerald-500/10 to-green-500/10',
                border: 'border-emerald-500/20',
                title: 'Consistency Rising!',
                text: `${last7Days.length} workouts this week vs ${last14Days.length} last week. Your consistency is improving — keep the momentum going!`,
            });
        } else if (last7Days.length < last14Days.length && last14Days.length >= 2) {
            result.push({
                icon: AlertTriangle,
                color: 'text-amber-400',
                bg: 'from-amber-500/10 to-yellow-500/10',
                border: 'border-amber-500/20',
                title: 'Activity Dip Detected',
                text: `Only ${last7Days.length} workout${last7Days.length !== 1 ? 's' : ''} this week, down from ${last14Days.length} last week. A quick session today can get you back on track.`,
            });
        } else if (last7Days.length >= 4) {
            result.push({
                icon: Flame,
                color: 'text-orange-400',
                bg: 'from-orange-500/10 to-red-500/10',
                border: 'border-orange-500/20',
                title: 'Beast Mode Active',
                text: `${last7Days.length} workouts in 7 days — you're training hard! Make sure you're getting enough rest and protein for recovery.`,
            });
        }

        // --- Muscle Group Balance ---
        const last14DayWorkouts = workoutLogs.filter(w => {
            const d = new Date(w.date);
            return (now - d) / (1000 * 60 * 60 * 24) <= 14;
        });
        
        const muscleGroupDays = {};
        last14DayWorkouts.forEach(w => {
            const type = (w.type || '').toLowerCase();
            const exercises = w.exercises;
            
            // Try to detect muscle groups from workout type
            const groups = [];
            if (type.includes('chest') || type.includes('push')) groups.push('chest');
            if (type.includes('back') || type.includes('pull')) groups.push('back');
            if (type.includes('leg') || type.includes('lower')) groups.push('legs');
            if (type.includes('shoulder')) groups.push('shoulders');
            if (type.includes('arm')) groups.push('arms');
            
            // Also check exercise names
            if (exercises && typeof exercises === 'object') {
                const exNames = Object.keys(exercises).join(' ').toLowerCase();
                if (exNames.includes('squat') || exNames.includes('leg') || exNames.includes('deadlift')) {
                    if (!groups.includes('legs')) groups.push('legs');
                }
                if (exNames.includes('bench') || exNames.includes('chest') || exNames.includes('fly')) {
                    if (!groups.includes('chest')) groups.push('chest');
                }
                if (exNames.includes('row') || exNames.includes('lat') || exNames.includes('pull')) {
                    if (!groups.includes('back')) groups.push('back');
                }
            }
            
            groups.forEach(g => {
                if (!muscleGroupDays[g]) muscleGroupDays[g] = new Set();
                muscleGroupDays[g].add(new Date(w.date).toDateString());
            });
        });

        // Find neglected muscle groups
        const trained = Object.keys(muscleGroupDays);
        const allGroups = ['chest', 'back', 'legs', 'shoulders', 'arms'];
        const untrained = allGroups.filter(g => !trained.includes(g));
        
        if (untrained.length > 0 && trained.length >= 2) {
            const missing = untrained.slice(0, 2).map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(' & ');
            result.push({
                icon: AlertTriangle,
                color: 'text-blue-400',
                bg: 'from-blue-500/10 to-indigo-500/10',
                border: 'border-blue-500/20',
                title: 'Muscle Balance Check',
                text: `You haven't trained ${missing} in the last 2 weeks. Balanced training prevents imbalances and injuries.`,
            });
        }

        // --- Weight Trend ---
        if (weightHistory.length >= 3) {
            const sorted = [...weightHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
            const recent = sorted.slice(-5);
            const first = parseFloat(recent[0].weight);
            const last = parseFloat(recent[recent.length - 1].weight);
            const diff = (last - first).toFixed(1);

            const goalWeight = parseFloat(profile?.goal_weight);
            const currentWeight = last;

            if (goalWeight && Math.abs(diff) > 0.2) {
                const wantToLose = goalWeight < first;
                const isLosingWeight = parseFloat(diff) < 0;
                
                if ((wantToLose && isLosingWeight) || (!wantToLose && !isLosingWeight)) {
                    result.push({
                        icon: TrendingUp,
                        color: 'text-emerald-400',
                        bg: 'from-emerald-500/10 to-teal-500/10',
                        border: 'border-emerald-500/20',
                        title: 'Weight Goal On Track',
                        text: `Your weight has moved ${Math.abs(diff)}kg toward your goal of ${goalWeight}kg. You're ${Math.abs(currentWeight - goalWeight).toFixed(1)}kg away — stay consistent!`,
                    });
                } else {
                    result.push({
                        icon: TrendingDown,
                        color: 'text-amber-400',
                        bg: 'from-amber-500/10 to-orange-500/10',
                        border: 'border-amber-500/20',
                        title: 'Weight Trend Alert',
                        text: `Your weight has moved ${Math.abs(diff)}kg ${isLosingWeight ? 'down' : 'up'}, but your goal is ${goalWeight}kg. Consider reviewing your nutrition and training load.`,
                    });
                }
            }
        }

        // --- Volume Progression ---
        const recentWorkouts = workoutLogs.slice(0, 10);
        if (recentWorkouts.length >= 4) {
            const volumes = recentWorkouts.map(w => {
                let vol = 0;
                const ex = w.exercises;
                if (ex && typeof ex === 'object' && !Array.isArray(ex)) {
                    Object.values(ex).forEach(sets => {
                        if (Array.isArray(sets)) {
                            sets.forEach(s => {
                                vol += (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0);
                            });
                        }
                    });
                }
                return vol;
            }).filter(v => v > 0);

            if (volumes.length >= 4) {
                const recentAvg = (volumes[0] + volumes[1]) / 2;
                const olderAvg = (volumes[2] + volumes[3]) / 2;
                
                if (olderAvg > 0) {
                    const change = ((recentAvg - olderAvg) / olderAvg * 100).toFixed(0);
                    if (parseFloat(change) > 10) {
                        result.push({
                            icon: TrendingUp,
                            color: 'text-violet-400',
                            bg: 'from-violet-500/10 to-purple-500/10',
                            border: 'border-violet-500/20',
                            title: 'Volume Increasing',
                            text: `Your recent workout volume is up ${change}% compared to earlier sessions. Progressive overload is the key to growth — great work!`,
                        });
                    }
                }
            }
        }

        // Fallback insight if none generated
        if (result.length === 0) {
            if (workoutLogs.length === 0) {
                result.push({
                    icon: Sparkles,
                    color: 'text-violet-400',
                    bg: 'from-violet-500/10 to-blue-500/10',
                    border: 'border-violet-500/20',
                    title: 'Ready to Begin',
                    text: 'Log your first workout and I\'ll start analyzing your patterns, tracking PRs, and providing personalized insights!',
                });
            } else {
                result.push({
                    icon: Sparkles,
                    color: 'text-blue-400',
                    bg: 'from-blue-500/10 to-cyan-500/10',
                    border: 'border-blue-500/20',
                    title: 'Keep Going',
                    text: `You've logged ${workoutLogs.length} workout${workoutLogs.length !== 1 ? 's' : ''} so far. Keep training consistently and I'll provide deeper insights as more data comes in!`,
                });
            }
        }

        return result;
    }, [workoutLogs, weightHistory, profile]);

    const currentInsight = insights[currentInsightIdx % insights.length];
    const Icon = currentInsight?.icon || Sparkles;

    const nextInsight = () => {
        setCurrentInsightIdx(prev => (prev + 1) % insights.length);
    };

    if (!currentInsight) return null;

    return (
        <div
            className={`relative overflow-hidden rounded-xl border ${currentInsight.border} bg-gradient-to-r ${currentInsight.bg} p-4 transition-all`}
        >
            <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg bg-zinc-900/50 border border-zinc-800 flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4.5 h-4.5 ${currentInsight.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-sm font-semibold ${currentInsight.color}`}>
                            {currentInsight.title}
                        </h4>
                        {insights.length > 1 && (
                            <button
                                onClick={nextInsight}
                                className="p-1 rounded hover:bg-zinc-800/50 transition-colors group"
                                title="Next insight"
                            >
                                <RefreshCw className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{currentInsight.text}</p>
                    {insights.length > 1 && (
                        <div className="flex gap-1 mt-2.5">
                            {insights.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1 rounded-full transition-all ${
                                        i === currentInsightIdx % insights.length
                                            ? `w-4 ${currentInsight.color.replace('text-', 'bg-')}`
                                            : 'w-1.5 bg-zinc-700'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
