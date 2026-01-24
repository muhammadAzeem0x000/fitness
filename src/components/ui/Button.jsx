import React from 'react';
import { cn } from '../../lib/utils';

export function Button({
    className,
    variant = 'default',
    size = 'default',
    children,
    ...props
}) {
    const variants = {
        default: "bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-sm",
        destructive: "bg-red-500 text-slate-50 hover:bg-red-500/90 shadow-sm",
        outline: "border border-zinc-800 bg-transparent hover:bg-zinc-800 hover:text-slate-100",
        secondary: "bg-zinc-800 text-slate-100 hover:bg-zinc-800/80",
        ghost: "hover:bg-zinc-800 hover:text-slate-100",
        link: "text-slate-100 underline-offset-4 hover:underline",
    };

    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
    };

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-300 disabled:pointer-events-none disabled:opacity-50",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
