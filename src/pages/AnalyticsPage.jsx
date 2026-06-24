import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Footprints, Flame, Activity, Info } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useHealthMetrics } from '../hooks/useHealthMetrics';
import { useHealthSync } from '../hooks/useHealthSync';
import { useWorkouts } from '../hooks/useWorkouts';
import { useAuth } from '../hooks/useAuth';
import { calculateReadiness } from '../lib/readiness';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Line, ComposedChart
} from 'recharts';

export default function AnalyticsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { refreshKey } = useHealthSync(user?.id);
    const { metrics, isLoading: metricsLoading } = useHealthMetrics(user?.id, 7, refreshKey);
    const { workoutLogs, isLoading: workoutsLoading } = useWorkouts(user?.id);

    if (metricsLoading || workoutsLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh]">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500">Loading your health data...</p>
            </div>
        );
    }

    // Prepare data for charts — use local date (not UTC toISOString)
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayMetrics = metrics.find(m => m.date === today) || { sleep_hours: 0, steps: 0, active_calories: 0 };
    
    const { score, status, recommendation, breakdown } = calculateReadiness({
        sleepHours: todayMetrics.sleep_hours,
        workoutLogs
    });

    // Format metrics for charts (reverse so oldest is first, left-to-right)
    const chartData = [...metrics].reverse().map(m => {
        const d = new Date(m.date);
        return {
            ...m,
            dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
            sleepLabel: `${m.sleep_hours} hrs`
        };
    });

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Readiness & Analytics</h1>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">Deep dive into your recovery metrics.</p>
                </div>
            </div>

            {/* Score Breakdown Section */}
            <div className="bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">
                            {score} <span className="text-lg text-slate-400">/ 100</span>
                        </h2>
                        <p className="font-medium text-emerald-500">{status}</p>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Activity className="w-8 h-8 text-emerald-500" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-bold tracking-wider uppercase text-slate-500 dark:text-zinc-500 mb-2">Score Breakdown</h3>
                    
                    {/* Sleep Factor */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                                <Moon className="w-4 h-4 text-indigo-400" /> Sleep Quality
                            </span>
                            <span className="font-semibold">{breakdown?.sleepScore}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${breakdown?.sleepScore}%` }} />
                        </div>
                    </div>

                    {/* Recovery Factor */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                                <Activity className="w-4 h-4 text-blue-400" /> Recovery Window
                            </span>
                            <span className="font-semibold">{breakdown?.recoveryScore}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${breakdown?.recoveryScore}%` }} />
                        </div>
                    </div>

                    {/* Volume Factor */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                                <Flame className="w-4 h-4 text-orange-400" /> Recent Load
                            </span>
                            <span className="font-semibold">{breakdown?.volumeScore}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${breakdown?.volumeScore}%` }} />
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50 flex gap-3">
                    <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                        {recommendation}
                    </p>
                </div>
            </div>

            {/* Sleep Trend */}
            <div className="bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Moon className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-bold text-slate-900 dark:text-white">7-Day Sleep Trend</h3>
                </div>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                            <XAxis dataKey="dayName" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} domain={[0, 12]} />
                            <RechartsTooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value) => [`${value} hrs`, 'Sleep']}
                            />
                            {/* Target line for 8 hours */}
                            <Line type="monotone" dataKey={() => 8} stroke="#10b981" strokeWidth={1} strokeDasharray="5 5" dot={false} activeDot={false} />
                            <Area type="monotone" dataKey="sleep_hours" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSleep)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Activity Trend */}
            <div className="bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Footprints className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-bold text-slate-900 dark:text-white">Steps & Calories</h3>
                </div>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                            <XAxis dataKey="dayName" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} />
                            <RechartsTooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar yAxisId="left" dataKey="steps" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                            <Line yAxisId="right" type="monotone" dataKey="active_calories" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: "#f97316" }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
