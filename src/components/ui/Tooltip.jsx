import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

export function TooltipProvider({ children }) {
    return (
        <TooltipPrimitive.Provider delayDuration={300}>
            {children}
        </TooltipPrimitive.Provider>
    );
}

export function Tooltip({ children, content, side = 'top' }) {
    return (
        <TooltipPrimitive.Root>
            <TooltipPrimitive.Trigger asChild>
                {children}
            </TooltipPrimitive.Trigger>
            <TooltipPrimitive.Portal>
                <TooltipPrimitive.Content
                    side={side}
                    className="z-50 overflow-hidden rounded-md bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100 shadow-xl animate-in fade-in-0 zoom-in-95"
                    sideOffset={5}
                >
                    {content}
                    <TooltipPrimitive.Arrow className="fill-zinc-700" />
                </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
    );
}
