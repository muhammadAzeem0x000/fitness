import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useUserPreferences } from '../../context/UserPreferencesContext';

export function WeightChart({ data }) {
    const { displayWeight, formatWeightLabel } = useUserPreferences();

    const chartData = useMemo(() => {
        return data.map(entry => ({
            ...entry,
            weight: displayWeight(entry.weight)
        }));
    }, [data, displayWeight]);

    return (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle>Weight Progress ({formatWeightLabel()})</CardTitle>
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
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
