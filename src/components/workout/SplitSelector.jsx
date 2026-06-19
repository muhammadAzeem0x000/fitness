import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

export function SplitSelector({ routines = [], selectedRoutine, onSelect }) {
    if (!routines || routines.length === 0) {
        return (
            <Card className="mb-6">
                <CardContent className="pt-6 text-center text-slate-500 dark:text-zinc-500">
                    No routines found. Please set up your routine in Onboarding.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Select Template</CardTitle>
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
                                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:text-slate-900 dark:hover:text-zinc-100'}
                            `}
                        >
                            <span className="font-semibold text-sm">{routine.name}</span>
                            <span className={`text-xs mt-1 ${selectedRoutine?.id === routine.id ? 'text-blue-100' : 'text-slate-500 dark:text-zinc-500'}`}>
                                {routine.exercises?.length || 0} exercises
                            </span>
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
