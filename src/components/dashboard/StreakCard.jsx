import React, { useMemo } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Flame, Calendar } from 'lucide-react';

export function StreakCard({ workouts = [], workoutDays = [] }) {
    const streak = useMemo(() => {
        console.log('=== STREAK CALCULATION DEBUG ===');
        console.log('Total workouts:', workouts.length);
        console.log('Workout days set:', workoutDays);

        if (workouts.length === 0) return { current: 0, longest: 0 };

        // Helper: Get day name from date
        const getDayName = (date) => {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return days[date.getDay()];
        };

        // Helper: Count scheduled workout days between two dates (exclusive of start, inclusive of end)
        const countScheduledDaysBetween = (startDate, endDate, scheduledDays) => {
            if (scheduledDays.length === 0) return Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

            let count = 0;
            const current = new Date(startDate);
            current.setDate(current.getDate() + 1); // Start from day after startDate

            while (current <= endDate) {
                if (scheduledDays.includes(getDayName(current))) {
                    count++;
                }
                current.setDate(current.getDate() + 1);
            }
            return count;
        };

        // Sort workouts by date (newest first) and deduplicate by day
        const uniqueWorkouts = [];
        const seenDays = new Set();
        [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(w => {
            const dateStr = new Date(w.date).toDateString();
            if (!seenDays.has(dateStr)) {
                seenDays.add(dateStr);
                uniqueWorkouts.push(w);
            }
        });
        const sortedWorkouts = uniqueWorkouts;

        console.log('Most recent 5 unique workouts:', sortedWorkouts.slice(0, 5).map(w => w.date));

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 1;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        console.log('Today:', today.toDateString(), `(${getDayName(today)})`);

        // Check if there's a workout on the most recent scheduled workout day
        const mostRecentDate = new Date(sortedWorkouts[0].date);
        mostRecentDate.setHours(0, 0, 0, 0);
        console.log('Most recent workout:', mostRecentDate.toDateString(), `(${getDayName(mostRecentDate)})`);

        // Find the most recent scheduled workout day (looking back from today)
        let mostRecentScheduledDay = new Date(today);
        if (workoutDays.length > 0) {
            // Go back from today to find the most recent day that's a scheduled workout day
            while (!workoutDays.includes(getDayName(mostRecentScheduledDay))) {
                mostRecentScheduledDay.setDate(mostRecentScheduledDay.getDate() - 1);
                // Prevent infinite loop - stop if we go too far back
                if (mostRecentScheduledDay < new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
                    mostRecentScheduledDay = new Date(today);
                    break;
                }
            }
        } else {
            // If no workout days set, treat today as the target
            mostRecentScheduledDay = today;
        }

        console.log('Most recent scheduled day:', mostRecentScheduledDay.toDateString(), `(${getDayName(mostRecentScheduledDay)})`);

        // Check if user worked out recently enough for streak to be active
        // We allow working out on the most recent scheduled day OR the one before it (1-day grace)
        const missedScheduledDays = countScheduledDaysBetween(mostRecentDate, mostRecentScheduledDay, workoutDays);

        console.log('Missed scheduled days between last workout and most recent scheduled day:', missedScheduledDays);
        console.log('Streak active?', missedScheduledDays <= 1);

        if (missedScheduledDays <= 1) {
            // Start counting current streak
            currentStreak = 1;

            for (let i = 1; i < sortedWorkouts.length; i++) {
                const currentDate = new Date(sortedWorkouts[i - 1].date);
                const prevDate = new Date(sortedWorkouts[i].date);
                currentDate.setHours(0, 0, 0, 0);
                prevDate.setHours(0, 0, 0, 0);

                const missedDays = countScheduledDaysBetween(prevDate, currentDate, workoutDays);

                if (missedDays <= 1) {
                    currentStreak++;
                } else {
                    console.log(`Streak broke between ${prevDate.toDateString()} and ${currentDate.toDateString()}, missed ${missedDays} scheduled days`);
                    break;
                }
            }
        }

        console.log('Final current streak:', currentStreak);
        console.log('=== END DEBUG ===');

        // Calculate longest streak
        for (let i = 1; i < sortedWorkouts.length; i++) {
            const currentDate = new Date(sortedWorkouts[i - 1].date);
            const prevDate = new Date(sortedWorkouts[i].date);
            currentDate.setHours(0, 0, 0, 0);
            prevDate.setHours(0, 0, 0, 0);

            const missedDays = countScheduledDaysBetween(prevDate, currentDate, workoutDays);

            if (missedDays <= 1) {
                tempStreak++;
            } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        return { current: currentStreak, longest: longestStreak };
    }, [workouts, workoutDays]);

    return (
        <Card className="relative overflow-hidden">
            {/* Background flame effect for active streaks */}
            {streak.current > 0 && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
            )}

            <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${streak.current > 0 ? 'bg-orange-500/20' : 'bg-slate-100 dark:bg-zinc-800'
                            }`}>
                            <Flame className={`w-5 h-5 ${streak.current > 0 ? 'text-orange-500' : 'text-slate-400 dark:text-zinc-600'
                                }`} />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-400">Workout Streak</h3>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-4xl font-bold ${streak.current > 0 ? 'text-orange-500' : 'text-slate-500 dark:text-zinc-500'
                                }`}>
                                {streak.current}
                            </span>
                            <span className="text-slate-500 dark:text-zinc-500 text-lg">
                                {streak.current === 1 ? 'day' : 'days'}
                            </span>
                            {streak.current >= 3 && <span className="text-2xl">🔥</span>}
                            {streak.current >= 7 && <span className="text-2xl">🔥</span>}
                            {streak.current >= 14 && <span className="text-2xl">🔥</span>}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-zinc-600 mt-1">Current streak</p>
                    </div>

                    {streak.longest > 0 && (
                        <div className="pt-3 border-t border-slate-200 dark:border-zinc-800">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 dark:text-zinc-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Longest streak
                                </span>
                                <span className="text-sm font-semibold text-slate-600 dark:text-zinc-400">
                                    {streak.longest} {streak.longest === 1 ? 'day' : 'days'}
                                </span>
                            </div>
                        </div>
                    )}

                    {streak.current === 0 && (
                        <p className="text-xs text-slate-400 dark:text-zinc-600 mt-2">
                            Start your streak by logging a workout today!
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
