import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, WifiOff } from 'lucide-react';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { hapticLight } from '../../lib/haptics';
import { useNetwork } from '../../hooks/useNetwork';

export function MobileHeader() {
    const location = useLocation();
    const navigate = useNavigate();
    const { preferences, toggleWeightUnit } = useUserPreferences();
    const { isOffline } = useNetwork();

    const path = location.pathname;
    
    // Determine title
    let title = 'SmartFit';
    if (path === '/dashboard' || path === '/') title = 'Training';
    else if (path === '/log') title = 'Workout';
    else if (path === '/ai-coach') title = 'AI Coach';
    else if (path === '/profile') title = 'Profile';
    else if (path === '/pricing') title = 'Upgrade';
    else if (path === '/auth') title = 'Login';
    else if (path === '/onboarding') title = 'Setup Profile';
    else if (path === '/success') title = 'Success';

    // Top-level routes where we DO NOT show a back button
    const topLevelRoutes = ['/', '/dashboard', '/log', '/ai-coach', '/profile'];
    const showBack = !topLevelRoutes.includes(path);

    const handleBack = () => {
        hapticLight();
        // If we came from nowhere and we hit back, fallback to dashboard
        if (window.history.length <= 2) {
            navigate('/dashboard', { replace: true });
        } else {
            navigate(-1);
        }
    };

    return (
        <header 
            className="bg-slate-900 border-b border-zinc-800 shadow-sm flex-none z-50 w-full"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
            <div className="flex items-center justify-between h-14 px-4">
                {/* Left: Back Button or Placeholder */}
                <div className="w-12 flex justify-start">
                    {showBack && (
                        <button 
                            onClick={handleBack}
                            className="p-2 -ml-2 rounded-full text-zinc-400 active:text-white active:bg-zinc-800 transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    )}
                </div>

                {/* Center: Title */}
                <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <h1 className="text-lg font-bold tracking-tight text-slate-100 truncate">
                        {title}
                    </h1>
                    {isOffline && (
                        <span className="flex items-center gap-1 text-[10px] text-red-400 font-medium leading-none mt-0.5">
                            <WifiOff className="w-3 h-3" /> Offline
                        </span>
                    )}
                </div>

                {/* Right: Unit Toggle */}
                <div className="w-12 flex justify-end">
                    <button
                        onClick={() => {
                            hapticLight();
                            toggleWeightUnit();
                        }}
                        className="flex items-center justify-center rounded-md bg-zinc-800/80 border border-zinc-700 px-2 h-7 text-[11px] font-bold text-blue-400 active:scale-95 transition-all shadow-sm"
                        title="Toggle Unit"
                    >
                        <span className="font-mono">{preferences.weightUnit === 'kg' ? 'KG' : 'LB'}</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
