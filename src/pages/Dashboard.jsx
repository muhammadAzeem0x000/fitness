import React, { useState, useEffect } from 'react';
import { StatsOverview } from '../components/dashboard/StatsOverview';
import { WeightChart } from '../components/dashboard/WeightChart';
import { VolumeChart } from '../components/dashboard/VolumeChart';
import { WorkoutHistoryList } from '../components/dashboard/WorkoutHistoryList';
import { Button } from '../components/ui/Button';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useWeight } from '../hooks/useWeight';
import { useWorkouts } from '../hooks/useWorkouts';
import { calculateBMI, getUserStats } from '../lib/fitnessUtils';

export function Dashboard() {
    const { user } = useAuth();
    const { profile, updateHeight } = useProfile(user?.id);
    const { weightHistory, addWeightEntry } = useWeight(user?.id);
    const { workoutLogs } = useWorkouts(user?.id);

    const { convertWeightToDb, formatWeightLabel } = useUserPreferences();
    const [inputValue, setInputValue] = useState('');

    const userStats = getUserStats(profile, weightHistory);
    const currentBMI = calculateBMI(userStats.currentWeight, userStats.height);

    const handleUpdate = async () => {
        if (!inputValue) return;
        const weightInKg = convertWeightToDb(inputValue);
        await addWeightEntry(weightInKg);
        setInputValue('');
    };

    return (
        <div className="grid gap-6 animate-in fade-in duration-500">
            <StatsOverview stats={userStats} currentBMI={currentBMI} />

            <div className="grid lg:grid-cols-2 gap-6">
                <WeightChart data={weightHistory} />
                <VolumeChart workouts={workoutLogs} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <WorkoutHistoryList workouts={workoutLogs} />
                </div>

                <div className="space-y-6">
                    {/* Quick Weight Entry */}
                    <div className="p-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30">
                        <h3 className="text-sm font-medium text-zinc-400 mb-3">
                            Quick Update Weight ({formatWeightLabel()})
                        </h3>
                        <div className="flex gap-2 w-full">
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

                    {/* Quick Height Entry */}
                    <HeightUpdater updateHeight={updateHeight} />
                </div>
            </div>
        </div>
    );
}

function HeightUpdater({ updateHeight }) {
    const { preferences, convertHeightToCm } = useUserPreferences();
    const [localUnit, setLocalUnit] = useState(preferences.heightUnit);
    const [val1, setVal1] = useState(''); // cm or feet
    const [val2, setVal2] = useState(''); // inches

    useEffect(() => {
        setLocalUnit(preferences.heightUnit);
    }, [preferences.heightUnit]);

    const handleUpdate = async () => {
        if (!val1) return;
        const heightInCm = convertHeightToCm(val1, val2, localUnit);
        await updateHeight(heightInCm);
        setVal1('');
        setVal2('');
    };

    const isFeet = localUnit === 'ft';

    return (
        <div className="p-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-zinc-400">
                    Quick Update Height
                </h3>
                <select
                    value={localUnit}
                    onChange={(e) => setLocalUnit(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    <option value="cm">CM</option>
                    <option value="ft">FT / IN</option>
                </select>
            </div>

            <div className={`grid gap-2 w-full ${isFeet ? 'grid-cols-[1fr_1fr_auto]' : 'grid-cols-[1fr_auto]'}`}>
                <input
                    type="number"
                    value={val1}
                    onChange={(e) => setVal1(e.target.value)}
                    placeholder={isFeet ? "Ft" : "Cm"}
                    className="w-full h-11 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-base placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 text-white min-w-0"
                />
                {isFeet && (
                    <input
                        type="number"
                        value={val2}
                        onChange={(e) => setVal2(e.target.value)}
                        placeholder="In"
                        className="w-full h-11 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-base placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 text-white min-w-0"
                    />
                )}
                <Button variant="secondary" className="h-11 px-4" onClick={handleUpdate}>
                    Update
                </Button>
            </div>
        </div>
    );
}
