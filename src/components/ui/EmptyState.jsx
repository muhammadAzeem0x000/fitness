import React from 'react';
import { Button } from './Button';

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    actionLabel,
    onAction
}) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-zinc-800/50 rounded-xl bg-zinc-900/20">
            {Icon && (
                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 shadow-xl">
                    <Icon className="w-8 h-8 text-zinc-600" />
                </div>
            )}

            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>

            {description && (
                <p className="text-zinc-500 max-w-md mx-auto leading-relaxed mb-6 text-sm">
                    {description}
                </p>
            )}

            {(action || (actionLabel && onAction)) && (
                <div className="mt-2">
                    {action || (
                        <Button onClick={onAction}>
                            {actionLabel}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
