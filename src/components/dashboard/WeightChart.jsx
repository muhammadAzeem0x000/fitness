import React, { useMemo, useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ResponsiveContainer, Brush } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useUserPreferences } from '../../context/UserPreferencesContext';

const DESKTOP_VISIBLE_NODES = 12;
const MOBILE_VISIBLE_NODES = 6;
const MOBILE_BREAKPOINT = 768;

export function WeightChart({ data }) {
    const { displayWeight, formatWeightLabel } = useUserPreferences();
    const [isMobile, setIsMobile] = useState(false);
    
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

    const visibleNodes = isMobile ? MOBILE_VISIBLE_NODES : DESKTOP_VISIBLE_NODES;
    
    // Calculate the start index for the Brush so it always shows the latest 'visibleNodes' by default
    const startIndex = Math.max(0, chartData.length - visibleNodes);

    return (
        <Card className="col-span-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Weight Progress ({formatWeightLabel()})</CardTitle>
                    {chartData.length > visibleNodes && (
                        <span className="text-[10px] text-zinc-500">
                            Use slider below to see older data
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pl-0 sm:pl-2">
                <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 30, right: 30, left: 30, bottom: 5 }}>
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
                                domain={['auto', 'auto']}
                                padding={{ top: 40, bottom: 10 }}
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
                            
                            {chartData.length > visibleNodes && (
                                <Brush 
                                    dataKey="date" 
                                    height={30} 
                                    stroke="#3f3f46"
                                    fill="#18181b"
                                    tickFormatter={() => ''}
                                    startIndex={startIndex}
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
