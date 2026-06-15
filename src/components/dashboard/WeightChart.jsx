import React, { useMemo, useState, useEffect, useRef, useDeferredValue } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useUserPreferences } from '../../context/UserPreferencesContext';

const DESKTOP_VISIBLE_NODES = 12;
const MOBILE_VISIBLE_NODES = 6;
const MOBILE_BREAKPOINT = 768;

// Custom Premium Tooltip
const CustomTooltip = ({ active, payload, label, formatWeightLabel }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-3 rounded-xl shadow-2xl">
                <p className="text-zinc-400 text-xs mb-1">{label}</p>
                <p className="text-white font-semibold text-lg flex items-baseline gap-1">
                    {payload[0].value} <span className="text-xs text-blue-400 font-medium">{formatWeightLabel()}</span>
                </p>
            </div>
        );
    }
    return null;
};

// Custom Active Dot to avoid any default SVG stroke/outline bugs
const CustomActiveDot = (props) => {
    const { cx, cy } = props;
    return (
        <g style={{ pointerEvents: 'none' }}>
            {/* Outer subtle glow */}
            <circle cx={cx} cy={cy} r={12} fill="#3b82f6" fillOpacity={0.2} style={{ outline: 'none' }} />
            {/* Inner solid dot */}
            <circle cx={cx} cy={cy} r={5} fill="#60a5fa" style={{ outline: 'none' }} />
        </g>
    );
};

export function WeightChart({ data }) {
    const { displayWeight, formatWeightLabel } = useUserPreferences();
    const [isMobile, setIsMobile] = useState(false);
    const chartContainerRef = useRef(null);
    
    const chartData = useMemo(() => {
        return data.map(entry => ({
            ...entry,
            weight: displayWeight(entry.weight)
        }));
    }, [data, displayWeight]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const visibleNodes = isMobile ? MOBILE_VISIBLE_NODES : DESKTOP_VISIBLE_NODES;
    const maxIndex = Math.max(0, chartData.length - visibleNodes);
    
    const [sliderValue, setSliderValue] = useState(maxIndex);

    useEffect(() => {
        setSliderValue(maxIndex);
    }, [maxIndex]);

    const deferredSliderValue = useDeferredValue(sliderValue);
    const currentIndex = Math.round(deferredSliderValue);

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
    }, [visibleData]);

    return (
        <Card className="col-span-full border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
            <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <CardTitle className="text-lg font-semibold text-white">Weight Progress</CardTitle>
                    {chartData.length > visibleNodes && (
                        <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-full border border-zinc-700/50 w-fit">
                            Swipe or drag slider for history
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pl-0 pr-0 sm:pl-2 sm:pr-2">
                <style dangerouslySetInnerHTML={{__html: `
                    .recharts-wrapper *, .recharts-surface * {
                        outline: none !important;
                        -webkit-tap-highlight-color: transparent !important;
                    }
                `}} />
                <div className="flex flex-col gap-2">
                    <div ref={chartContainerRef} className="h-[260px] w-full min-w-0 pointer-events-auto" style={{ outline: 'none', WebkitTapHighlightColor: 'transparent' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={visibleData} accessibilityLayer={false} margin={isMobile ? { top: 20, right: 15, left: -10, bottom: 0 } : { top: 20, right: 30, left: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#52525b"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={30}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#52525b"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={yDomain}
                                    width={isMobile ? 35 : 45}
                                    tickFormatter={(value) => `${value}`}
                                    dx={-5}
                                />
                                <Tooltip
                                    content={<CustomTooltip formatWeightLabel={formatWeightLabel} />}
                                    cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    isAnimationActive={false}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorWeight)"
                                    dot={false}
                                    activeDot={<CustomActiveDot />}
                                    animationDuration={500}
                                    style={{ pointerEvents: 'none' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Custom History Slider */}
                    {chartData.length > visibleNodes && (
                        <div className="px-8 pb-2 mt-2">
                            <input
                                type="range"
                                min="0"
                                max={maxIndex}
                                step="any"
                                value={sliderValue}
                                onChange={(e) => setSliderValue(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-0 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                                style={{ accentColor: '#3b82f6' }}
                            />
                            <div className="flex justify-between mt-2 text-[10px] text-zinc-500 px-1 font-medium">
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
