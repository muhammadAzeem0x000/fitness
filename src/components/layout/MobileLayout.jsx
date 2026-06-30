import React from 'react';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { useLocation } from 'react-router-dom';
import { ElasticScroll } from '../ui/ElasticScroll';

export function MobileLayout({ children, mainRef }) {
    const location = useLocation();
    
    // Ensure AI Coach takes full height without scrolling the body if it handles its own scroll.
    const isFixedLayout = ['/ai-coach'].includes(location.pathname);

    return (
        <div className="h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col">
            <MobileHeader />

            <main 
                ref={mainRef} 
                className="flex-1 w-full relative overflow-hidden"
            >
                {isFixedLayout ? (
                    <div className="w-full h-full">
                        {children}
                    </div>
                ) : (
                    <ElasticScroll>
                        <div className="w-full min-h-full pb-6 px-3 pt-4">
                            {children}
                        </div>
                    </ElasticScroll>
                )}
            </main>

            <MobileBottomNav />
        </div>
    );
}
