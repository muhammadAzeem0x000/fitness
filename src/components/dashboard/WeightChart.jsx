import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useUserPreferences } from '../../context/UserPreferencesContext';

const DESKTOP_VISIBLE_NODES = 12;
const MOBILE_VISIBLE_NODES = 6;
const MOBILE_BREAKPOINT = 768;
const NODE_WIDTH_DESKTOP = 80;
const NODE_WIDTH_MOBILE = 60;
const Y_AXIS_WIDTH = 45;
const CHART_HEIGHT = 300;

export function WeightChart({ data }) {
    const { displayWeight, formatWeightLabel } = useUserPreferences();
    const scrollRef = useRef(null);
    const [isMobile, setIsMobile] = useState(false);
    const [containerWidth, setContainerWidth] = useState(0);
    const containerRef = useRef(null);

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

    // Measure container width
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const visibleNodes = isMobile ? MOBILE_VISIBLE_NODES : DESKTOP_VISIBLE_NODES;
    const nodeWidth = isMobile ? NODE_WIDTH_MOBILE : NODE_WIDTH_DESKTOP;

    // Calculate chart width: either fit all nodes or fill container, whichever is larger
    const scrollableWidth = useMemo(() => {
        const availableWidth = containerWidth - Y_AXIS_WIDTH;
        if (chartData.length <= visibleNodes) {
            // If data fits within visible nodes, use full container width minus Y axis
            return Math.max(availableWidth, chartData.length * nodeWidth);
        }
        // Otherwise make it wide enough for all nodes
        return chartData.length * nodeWidth;
    }, [chartData.length, visibleNodes, nodeWidth, containerWidth]);

    // Compute Y-axis domain from ALL data so it stays consistent while scrolling
    const yDomain = useMemo(() => {
        if (chartData.length === 0) return [0, 100];
        const weights = chartData.map(d => d.weight);
        const min = Math.min(...weights);
        const max = Math.max(...weights);
        const padding = (max - min) * 0.15 || 5;
        return [Math.floor(min - padding), Math.ceil(max + padding)];
    }, [chartData]);

    // Auto-scroll to the right (latest data) on mount and when data changes
    const scrollToEnd = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
    }, []);

    useEffect(() => {
        // Small delay to ensure the chart has rendered
        const timer = setTimeout(scrollToEnd, 100);
        return () => clearTimeout(timer);
    }, [chartData, scrollToEnd, containerWidth]);

    const needsScroll = chartData.length > visibleNodes;

    return (
        <Card className="col-span-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Weight Progress ({formatWeightLabel()})</CardTitle>
                    {needsScroll && (
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                            </svg>
                            Scroll for more
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pl-0 sm:pl-2">
                <div ref={containerRef} className="w-full min-w-0" style={{ height: CHART_HEIGHT }}>
                    <div className="flex" style={{ height: '100%' }}>
                        {/* Fixed Y-Axis */}
                        <div style={{ width: Y_AXIS_WIDTH, flexShrink: 0, height: '100%' }}>
                            <LineChart
                                width={Y_AXIS_WIDTH + 20}
                                height={CHART_HEIGHT}
                                data={chartData}
                                margin={{ top: 30, right: 0, left: 0, bottom: 5 }}
                            >
                                <YAxis
                                    stroke="#71717a"
                                    fontSize={10}
                                    tick={{ fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={yDomain}
                                    width={Y_AXIS_WIDTH}
                                />
                            </LineChart>
                        </div>

                        {/* Scrollable Chart Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 min-w-0"
                            style={{
                                overflowX: needsScroll ? 'auto' : 'hidden',
                                overflowY: 'hidden',
                                height: '100%',
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#3f3f46 transparent',
                            }}
                        >
                            <div style={{ width: scrollableWidth, height: '100%' }}>
                                <LineChart
                                    width={scrollableWidth}
                                    height={CHART_HEIGHT}
                                    data={chartData}
                                    margin={{ top: 30, right: 30, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#71717a"
                                        fontSize={10}
                                        tick={{ fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#71717a"
                                        fontSize={10}
                                        tick={false}
                                        tickLine={false}
                                        axisLine={false}
                                        domain={yDomain}
                                        width={0}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                                        itemStyle={{ color: '#e2e8f0' }}
                                        formatter={(value) => [`${value} ${formatWeightLabel()}`, 'Weight']}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="weight"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={{ r: 4, fill: '#3b82f6' }}
                                        activeDot={{ r: 6 }}
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
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
