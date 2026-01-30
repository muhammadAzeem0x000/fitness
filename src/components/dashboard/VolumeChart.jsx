import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { TrendingUp, BarChart3 } from 'lucide-react';

export function VolumeChart({ workouts }) {
    const data = useMemo(() => {
        if (!workouts || workouts.length === 0) return [];

        // Sort by date ascending
        const sorted = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date));

        // Group by Date or just map each session? 
        // Let's map each session to total volume.
        return sorted.map(workout => {
            let totalVolume = 0;

            // Handle new structure where exercises is an object { "Bench Press": [ {weight, reps} ] }
            if (workout.exercises && typeof workout.exercises === 'object') {
                Object.values(workout.exercises).forEach(sets => {
                    if (Array.isArray(sets)) {
                        sets.forEach(set => {
                            const weight = parseFloat(set.weight) || 0;
                            const reps = parseFloat(set.reps) || 0;
                            totalVolume += weight * reps;
                        });
                    }
                });
            }

            return {
                date: new Date(workout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                volume: totalVolume,
                fullDate: new Date(workout.date).toLocaleDateString(),
                type: workout.type
            };
        }).slice(-10); // Show last 10 sessions
    }, [workouts]);

    if (!workouts || workouts.length === 0) return null;

    return (
        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">
                    Volume Load (Last 10 Sessions)
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#71717a"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#71717a"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#09090b',
                                    border: '1px solid #27272a',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                }}
                                formatter={(value) => [value.toLocaleString(), 'Volume']}
                                labelStyle={{ color: '#a1a1aa' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="volume"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
                                activeDot={{ r: 6, fill: '#60a5fa' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
