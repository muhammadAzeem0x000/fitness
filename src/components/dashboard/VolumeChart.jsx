import React, { useMemo, useRef, useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { useUserPreferences } from '../../context/UserPreferencesContext';

export function VolumeChart({ workouts }) {
    const { formatWeightLabel } = useUserPreferences();
    const chartContainerRef = useRef(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
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

    // Remove tabindex="0" that Recharts injects at runtime
    // This is the root cause of white focus borders on click/tap
    useEffect(() => {
        const container = chartContainerRef.current;
        if (!container) return;

        const removeFocusRings = () => {
            const focusableElements = container.querySelectorAll('[tabindex="0"]');
            focusableElements.forEach(el => {
                el.setAttribute('tabindex', '-1');
            });
        };

        removeFocusRings();
        const observer = new MutationObserver(removeFocusRings);
        observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['tabindex'] });
        return () => observer.disconnect();
    }, [data]);

    if (!workouts || workouts.length === 0) return null;

    const CustomLabel = (props) => {
        const { x, y, value, index } = props;
        const entry = data[index];
        const formattedValue = value > 999 ? `${(value / 1000).toFixed(1)}k` : value;
        const unit = formatWeightLabel(); // e.g. "kg" or "lbs"
        return (
            <g>
                <text x={x} y={y - 20} fill="#ffffff" textAnchor="middle" fontSize={10} fontWeight="500">
                    {formattedValue} <tspan fontSize={8} fill="#94a3b8">{unit}</tspan>
                </text>
                <text x={x} y={y - 8} fill="#cbd5e1" textAnchor="middle" fontSize={9}>
                    {entry?.type || ''}
                </text>
            </g>
        );
    };

    return (
        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">
                    Volume Load (Last 10 Sessions)
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="pl-0 pr-0 sm:pl-2 sm:pr-2">
                <div ref={chartContainerRef} className="h-[200px] w-full mt-4" style={{ outline: 'none', WebkitTapHighlightColor: 'transparent' }} tabIndex={-1}>
                    <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }} tabIndex={-1}>
                        <LineChart data={data} margin={isMobile ? { top: 40, right: 10, left: 0, bottom: 5 } : { top: 40, right: 20, left: 20, bottom: 5 }} style={{ outline: 'none' }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#71717a"
                                fontSize={isMobile ? 10 : 12}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={isMobile ? 15 : 30}
                            />
                            <YAxis
                                stroke="#71717a"
                                fontSize={isMobile ? 10 : 12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                                width={isMobile ? 38 : 55}
                                padding={{ top: 60, bottom: 0 }}
                            />
                            <Tooltip
                                cursor={{ stroke: '#27272a', strokeWidth: 1, strokeDasharray: '3 3' }}
                                contentStyle={{
                                    backgroundColor: '#09090b',
                                    border: '1px solid #27272a',
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                    outline: 'none',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                    padding: '8px 12px',
                                }}
                                formatter={(value) => [value.toLocaleString(), 'Volume']}
                                labelStyle={{ color: '#71717a', fontSize: '11px' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="volume"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
                                activeDot={{ r: 6, fill: '#60a5fa', strokeWidth: 0 }}
                            >
                                <LabelList content={<CustomLabel />} />
                            </Line>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
