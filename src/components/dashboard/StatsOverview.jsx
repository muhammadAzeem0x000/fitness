import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Activity, Ruler, Scale } from 'lucide-react';
import { useUserPreferences } from '../../context/UserPreferencesContext';

export function StatsOverview({ stats, currentBMI }) {
    const { displayWeight, displayHeight, formatWeightLabel, formatHeightLabel } = useUserPreferences();

    const getBMIData = (bmi) => {
        if (!bmi || bmi === '0.0') return { category: 'N/A', color: 'text-zinc-500', percent: 0 };
        const val = parseFloat(bmi);
        
        let percent = 0;
        let category = '';
        let color = '';

        if (val < 18.5) {
            category = 'Underweight';
            color = 'text-blue-400';
            // Map 15-18.5 to 0-25%
            percent = Math.max(0, Math.min(25, ((val - 15) / 3.5) * 25));
        } else if (val < 25) {
            category = 'Normal';
            color = 'text-emerald-400';
            // Map 18.5-25 to 25-50%
            percent = 25 + Math.min(25, ((val - 18.5) / 6.5) * 25);
        } else if (val < 30) {
            category = 'Overweight';
            color = 'text-yellow-400';
            // Map 25-30 to 50-75%
            percent = 50 + Math.min(25, ((val - 25) / 5) * 25);
        } else {
            category = 'Obese';
            color = 'text-red-400';
            // Map 30-40 to 75-100%
            percent = 75 + Math.min(25, ((val - 30) / 10) * 25);
        }

        return { category, color, percent };
    };

    const bmiData = getBMIData(currentBMI);

    const statItems = [
        {
            title: 'Current Weight',
            value: `${displayWeight(stats.currentWeight)} ${formatWeightLabel()}`,
            icon: Scale,
            color: 'text-blue-400'
        },
        {
            title: 'Height',
            value: `${displayHeight(stats.height)} ${formatHeightLabel()}`,
            icon: Ruler,
            color: 'text-emerald-400'
        },
        {
            title: 'BMI',
            value: currentBMI,
            icon: Activity,
            color: bmiData.color,
            customRender: (
                <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className={`font-medium ${bmiData.color}`}>{bmiData.category}</span>
                    </div>
                    <div className="relative w-full h-1.5 rounded-full overflow-hidden flex bg-zinc-800">
                        <div className="w-1/4 bg-blue-500/80"></div>
                        <div className="w-1/4 bg-emerald-500/80"></div>
                        <div className="w-1/4 bg-yellow-500/80"></div>
                        <div className="w-1/4 bg-red-500/80"></div>
                        
                        {currentBMI && currentBMI !== '0.0' && (
                            <div 
                                className="absolute top-0 bottom-0 w-[3px] bg-white rounded-full shadow-[0_0_4px_rgba(0,0,0,0.5)] transition-all duration-500"
                                style={{ left: `calc(${bmiData.percent}% - 1.5px)` }}
                            />
                        )}
                    </div>
                </div>
            )
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
                        {item.customRender ? (
                            item.customRender
                        ) : item.description ? (
                            <p className="text-xs text-zinc-500">{item.description}</p>
                        ) : null}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
