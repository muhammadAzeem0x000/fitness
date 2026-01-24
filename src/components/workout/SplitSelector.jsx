import React from 'react';
import { SPLIT_OPTIONS } from '../../data/exerciseLibrary';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

export function SplitSelector({ selectedSplit, onSelect }) {
    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Select Workout Day</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {SPLIT_OPTIONS.map((option) => (
                        <button
                            key={option}
                            onClick={() => onSelect(option)}
                            className={`
                min-h-[3.5rem] p-3 rounded-lg border text-sm font-medium transition-all active:scale-95 touch-manipulation
                ${selectedSplit === option
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20'
                                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}
              `}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
