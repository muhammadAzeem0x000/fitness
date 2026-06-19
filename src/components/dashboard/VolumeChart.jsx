import React, { useMemo, useRef, useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { BarChart3 } from 'lucide-react';
import { useUserPreferences } from '../../context/UserPreferencesContext';

// Custom Premium Tooltip
const CustomTooltip = ({ active, payload, label, formatWeightLabel }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200 dark:border-zinc-800 p-3 rounded-xl shadow-2xl z-50 relative">
                <p className="text-slate-500 dark:text-zinc-400 text-xs mb-1 font-medium">{data.fullDate}</p>
                <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-900 dark:text-white font-semibold flex items-baseline gap-1">
                        {payload[0].value.toLocaleString()} <span className="text-xs text-slate-500 dark:text-zinc-500">{formatWeightLabel()}</span>
                    </span>
                    <span className="text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-zinc-300">
                        {data.type}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export function VolumeChart({ workouts }) {
    const { formatWeightLabel } = useUserPreferences();
    const chartContainerRef = useRef(null);
    const [isMobile, setIsMobile] = useState(false);
    const [activeIndex, setActiveIndex] = useState(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const data = useMemo(() => {
        if (!workouts || workouts.length === 0) return [];
        const sorted = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date));

        return sorted.map(workout => {
            let totalVolume = 0;
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
                fullDate: new Date(workout.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
                type: workout.type || 'Workout'
            };
        }).slice(-10);
    }, [workouts]);

    // Ultimate Focus Killer: browsers draw thick focus rings on elements with tabindex.
    // Recharts forces tabindex="0" on its wrappers. Removing it completely stops the borders.
    useEffect(() => {
        const container = chartContainerRef.current;
        if (!container) return;

        const killFocus = () => {
            const elements = container.querySelectorAll('[tabindex]');
            elements.forEach(el => {
                el.removeAttribute('tabindex');
            });
            if (document.activeElement && container.contains(document.activeElement)) {
                document.activeElement.blur();
            }
        };

        killFocus();
        const observer = new MutationObserver(killFocus);
        observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['tabindex'] });
        return () => observer.disconnect();
    }, [data]);

    if (!workouts || workouts.length === 0) return null;

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
                <CardTitle className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-400" />
                    Volume Load
                </CardTitle>
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-medium bg-slate-100 dark:bg-zinc-800/50 px-2 py-1 rounded-md">Last 10 Sessions</span>
            </CardHeader>
            <CardContent className="pl-0 pr-0 sm:pl-2 sm:pr-2 flex-1 relative">
                <style dangerouslySetInnerHTML={{__html: `
                    .recharts-wrapper *, .recharts-surface * {
                        outline: none !important;
                        -webkit-tap-highlight-color: transparent !important;
                    }
                `}} />
                <div ref={chartContainerRef} className="h-[260px] w-full mt-2 pointer-events-auto" style={{ outline: 'none', WebkitTapHighlightColor: 'transparent' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                            data={data} 
                            accessibilityLayer={false}
                            margin={isMobile ? { top: 10, right: 10, left: -5, bottom: 0 } : { top: 10, right: 20, left: 10, bottom: 0 }}
                            onMouseMove={(state) => {
                                if (state.isTooltipActive) setActiveIndex(state.activeTooltipIndex);
                                else setActiveIndex(null);
                            }}
                            onMouseLeave={() => setActiveIndex(null)}
                        >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-zinc-800" vertical={false} />
                            <XAxis
                                dataKey="date"
                                className="fill-slate-500 dark:fill-zinc-400"
                                fontSize={isMobile ? 9 : 10}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={10}
                                dy={10}
                            />
                            <YAxis
                                className="fill-slate-500 dark:fill-zinc-400"
                                fontSize={isMobile ? 9 : 10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => value > 999 ? `${(value / 1000).toFixed(1)}k` : value}
                                width={isMobile ? 35 : 45}
                                dx={-5}
                            />
                            <Tooltip
                                cursor={{ fill: 'currentColor', opacity: 0.1, className: 'text-slate-800 dark:text-zinc-200' }}
                                content={<CustomTooltip formatWeightLabel={formatWeightLabel} />}
                                isAnimationActive={false}
                            />
                            <Bar 
                                dataKey="volume" 
                                radius={[6, 6, 0, 0]} 
                                barSize={isMobile ? 16 : 24}
                                animationDuration={500}
                                style={{ pointerEvents: 'none' }}
                            >
                                {data.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={index === activeIndex ? '#60a5fa' : '#3b82f6'} 
                                        style={{ outline: 'none', transition: 'fill 0.2s ease', pointerEvents: 'none' }}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
