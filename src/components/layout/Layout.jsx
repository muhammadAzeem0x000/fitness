import { Header } from './Header';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export function Layout({ children }) {
    const location = useLocation();

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
    }, [location.pathname]);

    return (
        <div className="h-[100dvh] bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col">
            <div className="flex-none z-50">
                <Header />
            </div>

            <main key={location.pathname} className="flex-1 overflow-y-auto custom-scrollbar pt-4 pb-4 px-3 md:px-6 md:pb-8">
                <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
