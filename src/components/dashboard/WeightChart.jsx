import React, { useMemo, useState, useEffect, useRef, useDeferredValue, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useUserPreferences } from '../../context/UserPreferencesContext';

const DESKTOP_VISIBLE_NODES = 12;
const MOBILE_VISIBLE_NODES = 6;
const MOBILE_BREAKPOINT = 768;

export function WeightChart({ data }) {
    const { displayWeight, formatWeightLabel } = useUserPreferences();
    const [isMobile, setIsMobile] = useState(false);
    const chartContainerRef = useRef(null);
    
    // Convert data for the chart
    const chartData = useMemo(() => {
        return data.map(entry => ({
            ...entry,
            weight: displayWeight(entry.weight)
        }));
    }, [data, displayWeight]);

    // Detect mobile vs desktop
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

        // Run immediately and also observe DOM changes (Recharts re-renders)
        removeFocusRings();
        const observer = new MutationObserver(removeFocusRings);
        observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['tabindex'] });
        return () => observer.disconnect();
    }, [chartData]);

    const visibleNodes = isMobile ? MOBILE_VISIBLE_NODES : DESKTOP_VISIBLE_NODES;
    const maxIndex = Math.max(0, chartData.length - visibleNodes);
    
    // Use a continuous float value for the slider for completely smooth thumb movement
    const [sliderValue, setSliderValue] = useState(maxIndex);

    // Keep slider at the rightmost edge when new data comes in
    useEffect(() => {
        setSliderValue(maxIndex);
    }, [maxIndex]);

    // Defer the value used to slice the chart data so the slider thumb never stutters
    const deferredSliderValue = useDeferredValue(sliderValue);
    const currentIndex = Math.round(deferredSliderValue);

    // Calculate fixed Y domain across all data so axis doesn't jump
    const yDomain = useMemo(() => {
        if (chartData.length === 0) return ['auto', 'auto'];
        const weights = chartData.map(d => parseFloat(d.weight)).filter(w => !isNaN(w));
        if (weights.length === 0) return ['auto', 'auto'];
        const min = Math.min(...weights);
        const max = Math.max(...weights);
        const padding = (max - min) * 0.15 || 5;
        return [Math.floor(min - padding), Math.ceil(max + padding)];
    }, [chartData]);

    const visibleData = chartData.slice(currentIndex, currentIndex + visibleNodes);

    return (
        <Card className="col-span-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Weight Progress ({formatWeightLabel()})</CardTitle>
                    {chartData.length > visibleNodes && (
                        <span className="text-[10px] text-zinc-400 bg-zinc-800/50 px-2 py-1 rounded-full border border-zinc-700/50">
                            Swipe or drag slider for history
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pl-0 pr-0 sm:pl-2 sm:pr-2">
                <div className="flex flex-col gap-4">
                    <div ref={chartContainerRef} className="h-[260px] w-full min-w-0" style={{ outline: 'none', WebkitTapHighlightColor: 'transparent' }} tabIndex={-1}>
                        <ResponsiveContainer width="100%" height="100%" className="focus:outline-none" style={{ outline: 'none' }} tabIndex={-1}>
                            <LineChart data={visibleData} margin={isMobile ? { top: 30, right: 15, left: -5, bottom: 5 } : { top: 30, right: 30, left: 10, bottom: 5 }} style={{ outline: 'none' }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#71717a"
                                    fontSize={10}
                                    tick={{ fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={30}
                                />
                                <YAxis
                                    stroke="#71717a"
                                    fontSize={10}
                                    tick={{ fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={yDomain}
                                    width={isMobile ? 30 : 45}
                                    padding={{ top: 40, bottom: 10 }}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#27272a', strokeWidth: 1, strokeDasharray: '3 3' }}
                                    contentStyle={{
                                        backgroundColor: '#09090b',
                                        border: '1px solid #27272a',
                                        borderRadius: '10px',
                                        outline: 'none',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                        padding: '8px 12px',
                                    }}
                                    itemStyle={{ color: '#94a3b8', fontSize: '12px' }}
                                    labelStyle={{ color: '#71717a', fontSize: '11px', marginBottom: '2px' }}
                                    formatter={(value) => [`${value} ${formatWeightLabel()}`, 'Weight']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                                    activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 0 }}
                                    style={{ outline: 'none' }}
                                >
                                    <LabelList
                                        dataKey="weight"
                                        position="top"
                                        offset={10}
                                        className="text-[10px] font-medium"
                                        fill="#ffffff"
                                        fontSize={10}
                                        fontWeight={500}
                                        formatter={(value) => `${value} ${formatWeightLabel()}`}
                                    />
                                </Line>
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Custom History Slider */}
                    {chartData.length > visibleNodes && (
                        <div className="px-8 pb-2">
                            <input
                                type="range"
                                min="0"
                                max={maxIndex}
                                step="any"
                                value={sliderValue}
                                onChange={(e) => setSliderValue(parseFloat(e.target.value))}
                                className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                style={{
                                    accentColor: '#3b82f6',
                                }}
                            />
                            <div className="flex justify-between mt-2 text-[10px] text-zinc-500 px-1">
                                <span>Older</span>
                                <span>Newer</span>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
