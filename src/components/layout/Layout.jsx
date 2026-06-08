import { Header } from './Header';
import { useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';

export function Layout({ children }) {
    const location = useLocation();
    const mainRef = useRef(null);

    useEffect(() => {
        const path = location.pathname;
        let title = 'SmartFit';

        if (path === '/') {
            title = 'Dashboard | SmartFit';
        } else if (path === '/log') {
            title = 'Log Workout | SmartFit';
        } else if (path === '/ai-coach') {
            title = 'AI Coach | SmartFit';
        }

        document.title = title;

        // Reset scroll position on route change to prevent jitter
        if (mainRef.current) {
            mainRef.current.scrollTo(0, 0);
        }
    }, [location.pathname]);

    const isFixedLayout = ['/ai-coach', '/log'].includes(location.pathname);

    return (
        <div className="h-[100dvh] bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col">
            <div className="flex-none z-50">
                <Header />
            </div>

            <main ref={mainRef} className={`flex-1 ${isFixedLayout ? 'overflow-hidden p-0' : 'overflow-y-auto custom-scrollbar pt-4 pb-4 px-3 md:px-4 md:pb-8'}`}>
                {isFixedLayout ? (
                    children
                ) : (
                    <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">
                        {children}
                    </div>
                )}
            </main>
        </div>
    );
}
