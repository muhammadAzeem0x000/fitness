import React, { useMemo } from 'react';

export function StreakHeatmap({ heatmapData }) {
    // Generate last 12 weeks (84 days) of dates
    const weeks = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today
        
        // Find the most recent Sunday to end the grid on
        const currentDay = today.getDay();
        const endDate = new Date(today);
        // If we want the grid to end on today, we just work backwards from today.
        // Let's make it exactly 12 weeks * 7 days = 84 days, ending today.
        
        const days = [];
        for (let i = 83; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            days.push(d);
        }

        // Group into weeks
        const weeksArray = [];
        for (let i = 0; i < days.length; i += 7) {
            weeksArray.push(days.slice(i, i + 7));
        }
        
        return weeksArray;
    }, []);

    const getColorClass = (count) => {
        if (!count || count === 0) return 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700';
        if (count === 1) return 'bg-emerald-300 dark:bg-emerald-800 border-emerald-400 dark:border-emerald-700';
        if (count === 2) return 'bg-emerald-400 dark:bg-emerald-600 border-emerald-500 dark:border-emerald-500';
        return 'bg-emerald-500 dark:bg-emerald-400 border-emerald-600 dark:border-emerald-300'; // 3+ workouts
    };

    return (
        <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Consistency Heatmap</h3>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 shadow-sm overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                    {weeks.map((week, wIndex) => (
                        <div key={wIndex} className="flex flex-col gap-1">
                            {week.map((date, dIndex) => {
                                const dateStr = date.toISOString().split('T')[0];
                                const count = heatmapData[dateStr] || 0;
                                return (
                                    <div 
                                        key={dIndex}
                                        className={`w-3 h-3 sm:w-4 sm:h-4 rounded-[3px] border transition-colors ${getColorClass(count)}`}
                                        title={`${dateStr}: ${count} workouts`}
                                    ></div>
                                );
                            })}
                        </div>
                    ))}
                </div>
                <div className="flex justify-end items-center gap-2 mt-4 text-xs text-slate-500 dark:text-zinc-500">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-[3px] bg-slate-100 dark:bg-zinc-800"></div>
                        <div className="w-3 h-3 rounded-[3px] bg-emerald-300 dark:bg-emerald-800"></div>
                        <div className="w-3 h-3 rounded-[3px] bg-emerald-400 dark:bg-emerald-600"></div>
                        <div className="w-3 h-3 rounded-[3px] bg-emerald-500 dark:bg-emerald-400"></div>
                    </div>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
}
