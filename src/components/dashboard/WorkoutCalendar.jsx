import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { ChevronLeft, ChevronRight, Dumbbell, CalendarDays } from 'lucide-react';

/**
 * Workout Calendar View
 * Visual calendar showing workout days with muscle group color coding.
 * Like a GitHub contribution graph for fitness.
 */
export function WorkoutCalendar({ workouts = [] }) {
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    const MUSCLE_COLORS = {
        chest: 'bg-red-500',
        push: 'bg-red-500',
        back: 'bg-blue-500',
        pull: 'bg-blue-500',
        legs: 'bg-emerald-500',
        lower: 'bg-emerald-500',
        shoulders: 'bg-amber-500',
        arms: 'bg-violet-500',
        cardio: 'bg-pink-500',
        full: 'bg-cyan-500',
        default: 'bg-blue-500',
    };

    const getColorForType = (type) => {
        if (!type) return MUSCLE_COLORS.default;
        const lower = type.toLowerCase();
        for (const [key, color] of Object.entries(MUSCLE_COLORS)) {
            if (lower.includes(key)) return color;
        }
        return MUSCLE_COLORS.default;
    };

    // Build workout map for the current month
    const workoutMap = useMemo(() => {
        const map = {};
        workouts.forEach(w => {
            const date = new Date(w.date);
            const key = date.toDateString();
            if (!map[key]) map[key] = [];
            map[key].push({
                type: w.type || 'Workout',
                color: getColorForType(w.type),
                exercises: w.exercises,
            });
        });
        return map;
    }, [workouts]);

    // Calendar generation
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
    const nextMonth = () => {
        const next = new Date(year, month + 1, 1);
        if (next <= new Date()) setCurrentMonth(next);
    };

    const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Stats for this month
    const monthWorkouts = workouts.filter(w => {
        const d = new Date(w.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });

    // Get unique days worked out
    const uniqueDays = new Set(monthWorkouts.map(w => new Date(w.date).toDateString()));

    const [selectedDay, setSelectedDay] = useState(null);

    // Build cells
    const cells = [];
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        cells.push({ empty: true, key: `empty-${i}` });
    }
    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const key = date.toDateString();
        const dayWorkouts = workoutMap[key] || [];
        const isToday = date.getTime() === today.getTime();
        const isFuture = date > today;
        cells.push({ day, date, key, workouts: dayWorkouts, isToday, isFuture });
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 text-base">
                        <CalendarDays className="w-4 h-4 text-blue-400" />
                        Workout Calendar
                    </CardTitle>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={prevMonth}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 min-w-[140px] text-center">{monthName}</span>
                        <button
                            onClick={nextMonth}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-30"
                            disabled={new Date(year, month + 1, 1) > new Date()}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 flex flex-col justify-center">
                    {/* Month stats */}
                <div className="flex items-center gap-4 mb-4 text-xs text-slate-500 dark:text-zinc-400">
                    <span className="bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                        <span className="text-slate-900 dark:text-white font-semibold">{monthWorkouts.length}</span> workouts
                    </span>
                    <span className="bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                        <span className="text-slate-900 dark:text-white font-semibold">{uniqueDays.size}</span> active days
                    </span>
                </div>

                {/* Day headers */}
                <div className="max-w-[280px] mx-auto w-full">
                    <div className="grid grid-cols-7 gap-1 mb-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-[10px] text-slate-400 dark:text-zinc-600 text-center font-medium py-1">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                    {cells.map((cell) => {
                        if (cell.empty) {
                            return <div key={cell.key} className="aspect-square" />;
                        }

                        const hasWorkout = cell.workouts.length > 0;
                        const isSelected = selectedDay === cell.key;

                        return (
                            <button
                                key={cell.key}
                                onClick={() => hasWorkout ? setSelectedDay(isSelected ? null : cell.key) : null}
                                className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all text-xs
                                    ${cell.isToday ? 'ring-1 ring-blue-500/50' : ''}
                                    ${cell.isFuture ? 'opacity-30' : ''}
                                    ${hasWorkout ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800' : 'cursor-default'}
                                    ${isSelected ? 'bg-slate-100 dark:bg-zinc-800 ring-1 ring-slate-300 dark:ring-zinc-600' : ''}
                                `}
                            >
                                <span className={`text-[11px] font-medium ${
                                    cell.isToday ? 'text-blue-400' :
                                    hasWorkout ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-zinc-600'
                                }`}>
                                    {cell.day}
                                </span>
                                {hasWorkout && (
                                    <div className="flex gap-0.5 mt-0.5">
                                        {cell.workouts.slice(0, 3).map((w, i) => (
                                            <div
                                                key={i}
                                                className={`w-1.5 h-1.5 rounded-full ${w.color}`}
                                                title={w.type}
                                            />
                                        ))}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                </div>

                {/* Selected day detail */}
                {selectedDay && workoutMap[selectedDay] && (
                    <div className="mt-3 p-3 bg-white/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-2 animate-in slide-in-from-top-2 duration-200">
                        <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                            {new Date(selectedDay).toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                        {workoutMap[selectedDay].map((w, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${w.color}`} />
                                <span className="text-sm text-slate-900 dark:text-white font-medium">{w.type}</span>
                                {w.exercises && typeof w.exercises === 'object' && (
                                    <span className="text-xs text-slate-500 dark:text-zinc-500">
                                        ({Object.keys(w.exercises).length} exercises)
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-slate-200 dark:border-zinc-800 justify-center">
                    {[
                        { label: 'Push/Chest', color: 'bg-red-500' },
                        { label: 'Pull/Back', color: 'bg-blue-500' },
                        { label: 'Legs', color: 'bg-emerald-500' },
                        { label: 'Shoulders', color: 'bg-amber-500' },
                        { label: 'Arms', color: 'bg-violet-500' },
                    ].map(item => (
                        <div key={item.label} className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-zinc-500">
                            <div className={`w-2 h-2 rounded-full ${item.color}`} />
                            {item.label}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
