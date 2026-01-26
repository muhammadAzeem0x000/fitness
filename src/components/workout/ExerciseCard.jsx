import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import { History } from 'lucide-react';

export function ExerciseCard({ exercise, lastSession, onUpdateSets }) {
    // Initialize 3 sets by default
    const [sets, setSets] = useState([
        { weight: '', reps: '' },
        { weight: '', reps: '' },
        { weight: '', reps: '' }
    ]);

    // Lift state up whenever local state changes
    useEffect(() => {
        onUpdateSets(exercise, sets);
    }, [sets, onUpdateSets, exercise]);

    const updateSet = (index, field, value) => {
        const newSets = [...sets];
        newSets[index] = { ...newSets[index], [field]: value };
        setSets(newSets);
    };

    // Helper to format last session text
    // Assuming lastSession is array of sets [{weight, reps}, ...]
    const getLastBestSet = () => {
        if (!lastSession || !Array.isArray(lastSession)) return "New Exercise";
        // Find max weight or just show last working set?
        // Let's show the best set (max weight)
        const bestSet = lastSession.reduce((max, set) => {
            const w = parseFloat(set.weight) || 0;
            const currentMax = parseFloat(max.weight) || 0;
            return w > currentMax ? set : max;
        }, { weight: 0, reps: 0 });

        if (bestSet.weight === 0) return "No data";
        return `${bestSet.weight}kg x ${bestSet.reps}`;
    };

    return (
        <Card className="mb-4 border-l-4 border-l-blue-500 bg-zinc-900/50">
            <CardContent className="pt-4 pb-4">
                <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lg font-semibold text-slate-200">{exercise}</h4>
                    {lastSession && (
                        <div className="flex items-center gap-1 text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20" title="Last Session Best">
                            <History className="h-3 w-3" />
                            <span>Last: {getLastBestSet()}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    {sets.map((set, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <span className="text-xs font-mono text-zinc-500 w-8 shrink-0">#{index + 1}</span>

                            <input
                                type="number"
                                placeholder="kg"
                                value={set.weight}
                                onChange={(e) => updateSet(index, 'weight', e.target.value)}
                                className="w-1/2 h-9 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-sm text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                            />

                            <input
                                type="number"
                                placeholder="reps"
                                value={set.reps}
                                onChange={(e) => updateSet(index, 'reps', e.target.value)}
                                className="w-1/2 h-9 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-sm text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                            />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
