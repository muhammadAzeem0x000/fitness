import React from 'react';
import { Dumbbell, LogOut, LayoutDashboard, PlusCircle, BrainCircuit } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { Link, useLocation } from 'react-router-dom';

export function Header() {
    const { preferences, toggleWeightUnit } = useUserPreferences();
    const location = useLocation();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    const NavLink = ({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to;
        const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-300 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 gap-2";
        const stateClasses = isActive
            ? "bg-zinc-800 text-slate-100 hover:bg-zinc-800/80"
            : "hover:bg-zinc-800 hover:text-slate-100 text-zinc-400";

        return (
            <Link to={to} className={`${baseClasses} ${stateClasses} no-underline`}>
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
            </Link>
        );
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-zinc-800 bg-slate-900/70 backdrop-blur-md shadow-sm supports-[backdrop-filter]:bg-slate-900/60">
            <div className="container flex h-14 items-center px-3 md:px-6 justify-between">
                <Link to="/" className="flex items-center gap-2 font-bold text-xl md:text-2xl text-blue-400 hover:text-blue-300 transition-colors">
                    <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
                    <span>SmartFit</span>
                </Link>

                <nav className="flex items-center gap-1 sm:gap-2">
                    <NavLink to="/" icon={LayoutDashboard} label="Dashboard" />
                    <NavLink to="/log" icon={PlusCircle} label="Log Workout" />
                    <NavLink to="/ai-coach" icon={BrainCircuit} label="AI Coach" />
                </nav>

                <div className="flex items-center gap-2 md:gap-4 ml-2">
                    {/* Unit Toggle */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleWeightUnit}
                        className="text-zinc-400 hover:text-white text-xs md:text-sm px-2 font-mono"
                        title="Toggle Weight Unit"
                    >
                        {preferences.weightUnit === 'kg' ? 'KG / FT' : 'LBS / CM'}
                    </Button>

                    <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                        <LogOut className="h-4 w-4 text-zinc-400 hover:text-red-400 transition-colors" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
