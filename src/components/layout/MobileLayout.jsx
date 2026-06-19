import React from 'react';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { useLocation } from 'react-router-dom';

export function MobileLayout({ children, mainRef }) {
    const location = useLocation();
    
    // Ensure AI Coach takes full height without scrolling the body if it handles its own scroll.
    const isFixedLayout = ['/ai-coach'].includes(location.pathname);

    return (
        <div className="h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col">
            <MobileHeader />

            <main 
                ref={mainRef} 
                className={`flex-1 w-full relative ${isFixedLayout ? 'overflow-hidden' : 'overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'}`}
            >
                <div className={`w-full ${isFixedLayout ? 'h-full' : 'min-h-full pb-6 px-3 pt-4'}`}>
                    {children}
                </div>
            </main>

            <MobileBottomNav />
        </div>
    );
}
