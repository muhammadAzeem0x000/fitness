import React from 'react';
import { cn } from '../../lib/utils';

export function Card({ className, children, ...props }) {
    return (
        <div
            className={cn(
                "rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-100 shadow-sm backdrop-blur-sm",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }) {
    return (
        <div
            className={cn("flex flex-col space-y-1.5 p-6", className)}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardTitle({ className, children, ...props }) {
    return (
        <h3
            className={cn(
                "text-lg md:text-xl font-semibold leading-none tracking-tight",
                className
            )}
            {...props}
        >
            {children}
        </h3>
    );
}

export function CardContent({ className, children, ...props }) {
    return (
        <div className={cn("p-6 pt-0", className)} {...props}>
            {children}
        </div>
    );
}
