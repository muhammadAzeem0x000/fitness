import React from 'react';
import { Dumbbell } from 'lucide-react';

export function Layout({ children }) {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
            <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-slate-900/80 backdrop-blur-sm">
                <div className="container flex h-14 items-center px-3 md:px-6">
                    <div className="flex items-center gap-2 font-bold text-xl md:text-2xl text-blue-400">
                        <Dumbbell className="h-6 w-6" />
                        <span>SmartFit</span>
                    </div>
                    <nav className="ml-auto flex items-center gap-4 sm:gap-6">
                        {/* Navigation items can be added here if we use React Router */}
                    </nav>
                </div>
            </header>
            <main className="container py-4 px-3 md:px-6 md:py-8 space-y-6 md:space-y-8">
                {children}
            </main>
        </div>
    );
}
