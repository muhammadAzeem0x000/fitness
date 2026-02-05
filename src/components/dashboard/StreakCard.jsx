import React, { useMemo } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Flame, Calendar } from 'lucide-react';

export function StreakCard({ workouts = [] }) {
    const streak = useMemo(() => {
        if (workouts.length === 0) return { current: 0, longest: 0 };

        // Sort workouts by date (newest first)
        const sortedWorkouts = [...workouts].sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 1;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if there's a workout today or yesterday for current streak
        const mostRecentDate = new Date(sortedWorkouts[0].date);
        mostRecentDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((today - mostRecentDate) / (1000 * 60 * 60 * 24));

        if (daysDiff <= 1) {
            // Start counting current streak
            currentStreak = 1;

            for (let i = 1; i < sortedWorkouts.length; i++) {
                const currentDate = new Date(sortedWorkouts[i - 1].date);
                const prevDate = new Date(sortedWorkouts[i].date);
                currentDate.setHours(0, 0, 0, 0);
                prevDate.setHours(0, 0, 0, 0);

                const diff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));

                if (diff <= 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }

        // Calculate longest streak
        for (let i = 1; i < sortedWorkouts.length; i++) {
            const currentDate = new Date(sortedWorkouts[i - 1].date);
            const prevDate = new Date(sortedWorkouts[i].date);
            currentDate.setHours(0, 0, 0, 0);
            prevDate.setHours(0, 0, 0, 0);

            const diff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));

            if (diff <= 1) {
                tempStreak++;
            } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        return { current: currentStreak, longest: longestStreak };
    }, [workouts]);

    return (
        <Card className="relative overflow-hidden">
            {/* Background flame effect for active streaks */}
            {streak.current > 0 && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
            )}

            <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${streak.current > 0 ? 'bg-orange-500/20' : 'bg-zinc-800'
                            }`}>
                            <Flame className={`w-5 h-5 ${streak.current > 0 ? 'text-orange-500' : 'text-zinc-600'
                                }`} />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-zinc-400">Workout Streak</h3>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-4xl font-bold ${streak.current > 0 ? 'text-orange-500' : 'text-zinc-500'
                                }`}>
                                {streak.current}
                            </span>
                            <span className="text-zinc-500 text-lg">
                                {streak.current === 1 ? 'day' : 'days'}
                            </span>
                            {streak.current >= 3 && <span className="text-2xl">🔥</span>}
                            {streak.current >= 7 && <span className="text-2xl">🔥</span>}
                            {streak.current >= 14 && <span className="text-2xl">🔥</span>}
                        </div>
                        <p className="text-xs text-zinc-600 mt-1">Current streak</p>
                    </div>

                    {streak.longest > 0 && (
                        <div className="pt-3 border-t border-zinc-800">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-zinc-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Longest streak
                                </span>
                                <span className="text-sm font-semibold text-zinc-400">
                                    {streak.longest} {streak.longest === 1 ? 'day' : 'days'}
                                </span>
                            </div>
                        </div>
                    )}

                    {streak.current === 0 && (
                        <p className="text-xs text-zinc-600 mt-2">
                            Start your streak by logging a workout today!
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
