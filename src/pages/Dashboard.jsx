import React, { useState } from 'react';
import { StatsOverview } from '../components/dashboard/StatsOverview';
import { WeightChart } from '../components/dashboard/WeightChart';
import { Button } from '../components/ui/Button';
import { useUserPreferences } from '../context/UserPreferencesContext';

export function Dashboard({ userStats, currentBMI, weightHistory, addWeightEntry }) {
    const { preferences, convertWeightToDb, formatWeightLabel } = useUserPreferences();
    const [inputValue, setInputValue] = useState('');

    const handleUpdate = () => {
        if (!inputValue) return;
        const weightInKg = convertWeightToDb(inputValue);
        addWeightEntry(weightInKg);
        setInputValue('');
    };

    return (
        <div className="grid gap-6 animate-in fade-in duration-500">
            <StatsOverview stats={userStats} currentBMI={currentBMI} />
            <WeightChart data={weightHistory} />

            {/* Quick Weight Entry */}
            <div className="p-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30">
                <h3 className="text-sm font-medium text-zinc-400 mb-3">
                    Quick Update Weight ({formatWeightLabel()})
                </h3>
                <div className="flex gap-2 w-full max-w-sm">
                    <input
                        type="number"
                        step="0.1"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={`Enter (${formatWeightLabel()})`}
                        className="flex-1 h-11 min-w-0 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-base placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleUpdate();
                            }
                        }}
                    />
                    <Button variant="secondary" className="h-11" onClick={handleUpdate}>
                        Update
                    </Button>
                </div>
            </div>
        </div>
    );
}
