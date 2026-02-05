import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Trophy, TrendingUp, Calendar } from 'lucide-react';
import { useUserPreferences } from '../../context/UserPreferencesContext';

export function PersonalRecords({ workouts = [] }) {
    const { displayWeight, formatWeightLabel } = useUserPreferences();

    // Calculate PRs from workout logs
    const personalRecords = useMemo(() => {
        const prs = {};

        // Get last 30 days for "recent PRs"
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        workouts.forEach(workout => {
            const exercises = workout.exercises || {};
            const workoutDate = new Date(workout.date);

            Object.entries(exercises).forEach(([exerciseName, sets]) => {
                if (!Array.isArray(sets)) return;

                sets.forEach(set => {
                    const weight = parseFloat(set.weight) || 0;
                    if (weight === 0) return;

                    if (!prs[exerciseName] || weight > prs[exerciseName].weight) {
                        prs[exerciseName] = {
                            weight,
                            date: workout.date,
                            reps: set.reps,
                            isRecent: workoutDate >= thirtyDaysAgo
                        };
                    }
                });
            });
        });

        // Convert to array and sort by date (most recent first)
        return Object.entries(prs)
            .map(([exercise, data]) => ({ exercise, ...data }))
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5); // Top 5 PRs

    }, [workouts]);

    if (personalRecords.length === 0) {
        return null; // Don't show if no PRs
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Personal Records
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {personalRecords.map((pr, index) => (
                        <div
                            key={pr.exercise + pr.date}
                            className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors"
                        >
                            <div className="flex-1">
                                <div className="font-medium text-white text-sm flex items-center gap-2">
                                    {pr.exercise}
                                    {pr.isRecent && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                            New!
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(pr.date).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-yellow-500">
                                    {displayWeight(pr.weight)} {formatWeightLabel()}
                                </div>
                                <div className="text-xs text-zinc-500">
                                    {pr.reps} reps
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {personalRecords.length === 0 && (
                    <p className="text-center text-zinc-500 text-sm py-4">
                        No personal records yet. Keep lifting! 💪
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
