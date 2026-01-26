import { Header } from './Header';
import { useLocation } from 'react-router-dom';

export function Layout({ children }) {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
            <Header />
            <main key={location.pathname} className="container py-4 px-3 md:px-6 md:py-8 space-y-6 md:space-y-8">
                {children}
            </main>
        </div>
    );
}
