import React from 'react';
import { SwipeableTemplateCard } from './SwipeableTemplateCard';

export function SplitSelector({ routines = [], selectedRoutine, onSelect, onEdit, onDelete, workoutLogs = [] }) {
    if (!routines || routines.length === 0) {
        return (
            <div className="p-6 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-center text-slate-500 dark:text-zinc-500">
                No templates found. Start a workout above to save one.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            <p className="text-xs text-slate-400 dark:text-zinc-500 mb-3 ml-1">
                Tip: Swipe left on a template to edit or delete
            </p>
            {routines.map((routine) => (
                <SwipeableTemplateCard
                    key={routine.id}
                    routine={routine}
                    isSelected={selectedRoutine?.id === routine.id}
                    onSelect={onSelect}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    workoutLogs={workoutLogs}
                />
            ))}
        </div>
    );
}
