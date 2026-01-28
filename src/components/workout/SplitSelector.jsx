import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

export function SplitSelector({ routines = [], selectedRoutine, onSelect }) {
    if (!routines || routines.length === 0) {
        return (
            <Card className="mb-6">
                <CardContent className="pt-6 text-center text-zinc-500">
                    No routines found. Please set up your routine in Onboarding.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mb-6 bg-zinc-900/50 border-zinc-800">
            <CardHeader>
                <CardTitle className="text-white">Select Workout Day</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {routines.map((routine) => (
                        <button
                            key={routine.id}
                            type="button"
                            onClick={() => onSelect(routine)}
                            className={`
                                min-h-[4rem] p-3 rounded-xl border text-left transition-all active:scale-95 touch-manipulation flex flex-col justify-center
                                ${selectedRoutine?.id === routine.id
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700 hover:text-zinc-100'}
                            `}
                        >
                            <span className="font-semibold text-sm">{routine.name}</span>
                            {routine.schedule_days && routine.schedule_days.length > 0 && (
                                <span className={`text-xs mt-1 ${selectedRoutine?.id === routine.id ? 'text-red-100' : 'text-zinc-500'}`}>
                                    {routine.schedule_days.join(', ')}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
