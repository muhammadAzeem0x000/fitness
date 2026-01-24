import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Activity, Ruler, Scale } from 'lucide-react';

export function StatsOverview({ stats, currentBMI }) {
    const statItems = [
        {
            title: 'Current Weight',
            value: `${stats.currentWeight} kg`,
            icon: Scale,
            color: 'text-blue-400'
        },
        {
            title: 'Height',
            value: `${stats.height} cm`,
            icon: Ruler,
            color: 'text-emerald-400'
        },
        {
            title: 'BMI',
            value: currentBMI,
            icon: Activity,
            color: 'text-purple-400',
            description: 'Calculated'
        }
    ];

    return (
        <div className="grid gap-2 md:grid-cols-3 md:gap-4">
            {statItems.map((item) => (
                <Card key={item.title}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            {item.title}
                        </CardTitle>
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{item.value}</div>
                        {item.description && (
                            <p className="text-xs text-zinc-500">{item.description}</p>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
