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
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
            <Header />
            <main key={location.pathname} className="container pt-20 pb-4 px-3 md:px-6 md:pt-24 md:pb-8 space-y-6 md:space-y-8">
                {children}
            </main>
        </div>
    );
}
