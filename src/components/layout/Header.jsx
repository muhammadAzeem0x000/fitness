import React from 'react';
import { Dumbbell, LogOut, LayoutDashboard, PlusCircle, BrainCircuit, User, Sparkles, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserProfileDialog } from '../profile/UserProfileDialog';
import { useState } from 'react';
import { useSubscription } from '../../hooks/useSubscription';

export function Header() {
    const { preferences, toggleWeightUnit } = useUserPreferences();
    const { user } = useAuth();
    const { profile } = useProfile(user?.id);
    const location = useLocation();
    const navigate = useNavigate();
    const { isPremium, isLoading: subLoading } = useSubscription();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const NavLink = ({ to, icon: Icon, label, description, isPrimary }) => {
        const isActive = location.pathname === to;
        const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-300 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 gap-2";

        let stateClasses;
        if (isPrimary) {
            stateClasses = isActive
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-blue-600/90 text-white hover:bg-blue-600";
        } else {
            stateClasses = isActive
                ? "bg-zinc-800 text-slate-100 hover:bg-zinc-800/80"
                : "hover:bg-zinc-800 hover:text-slate-100 text-zinc-400";
        }

        return (
            <Link
                to={to}
                className={`${baseClasses} ${stateClasses} no-underline`}
                title={description}
            >
                <Icon className="h-4 w-4" />
                <span className="text-xs sm:text-sm">{label}</span>
            </Link>
        );
    };

    const MobileNavLink = ({ to, icon: Icon, label, isPrimary }) => {
        const isActive = location.pathname === to;
        const baseClasses = "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors w-full";
        
        let stateClasses;
        if (isPrimary) {
            stateClasses = isActive
                ? "bg-blue-600 text-white"
                : "bg-blue-600/90 text-white hover:bg-blue-600";
        } else {
            stateClasses = isActive
                ? "bg-zinc-800 text-slate-100"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-slate-100";
        }

        return (
            <Link to={to} className={`${baseClasses} ${stateClasses} no-underline`} onClick={() => setIsMobileMenuOpen(false)}>
                <Icon className="w-5 h-5" />
                {label}
            </Link>
        );
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-slate-900/95 backdrop-blur-md shadow-sm supports-[backdrop-filter]:bg-slate-900/80">
            <div className="container flex h-14 items-center px-3 md:px-6 justify-between">
                <Link to="/" className="flex items-center gap-2 font-bold text-xl md:text-2xl text-blue-400 hover:text-blue-300 transition-colors">
                    <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
                    <span className="hidden sm:inline">SmartFit</span>
                </Link>

                <nav className="hidden md:flex items-center gap-1 sm:gap-2">
                    <NavLink
                        to="/"
                        icon={LayoutDashboard}
                        label="Dashboard"
                        description="View your progress, stats, and workout history"
                    />
                    <NavLink
                        to="/log"
                        icon={PlusCircle}
                        label="Log Workout"
                        description="Record your workout sets and track progress"
                        isPrimary={true}
                    />
                    <NavLink
                        to="/ai-coach"
                        icon={BrainCircuit}
                        label="AI Coach"
                        description="Get personalized AI insights and recommendations"
                    />
                </nav>

                {/* Upgrade Button (Free Users Only) */}
                {!isPremium && !subLoading && (
                    <button
                        onClick={() => navigate('/pricing')}
                        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium text-sm shadow-lg transition-all ml-4"
                    >
                        <Sparkles className="w-4 h-4" />
                        Upgrade to Pro
                    </button>
                )}

                <div className="flex items-center gap-2 md:gap-4 ml-auto md:ml-2">
                    {/* Unit Toggle */}
                    <button
                        onClick={toggleWeightUnit}
                        className="flex items-center justify-center rounded-full bg-zinc-800/60 border border-zinc-700/80 px-3 h-8 text-[10px] sm:text-xs font-medium text-zinc-300 transition-all hover:bg-zinc-700 hover:text-white hover:border-zinc-600 shadow-sm backdrop-blur-sm whitespace-nowrap"
                        title="Toggle Weight Unit"
                    >
                        <span className="font-mono tracking-wider">{preferences.weightUnit === 'kg' ? 'KG/FT' : 'LB/CM'}</span>
                    </button>

                    {/* Profile Trigger */}
                    <button
                        onClick={() => setIsProfileOpen(true)}
                        className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-zinc-600 overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 hover:ring-offset-slate-900 shadow-sm transition-all group shrink-0"
                    >
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        ) : (
                            <User className="w-4 h-4 text-zinc-300 group-hover:text-white transition-colors" />
                        )}
                    </button>

                    {/* Hamburger Menu Toggle (Mobile Only) */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden flex items-center justify-center w-9 h-9 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-14 left-0 w-full border-b border-zinc-800 bg-slate-900/95 backdrop-blur-md px-4 py-4 space-y-2 shadow-xl animate-in slide-in-from-top-2">
                    <MobileNavLink
                        to="/"
                        icon={LayoutDashboard}
                        label="Dashboard"
                    />
                    <MobileNavLink
                        to="/log"
                        icon={PlusCircle}
                        label="Log Workout"
                        isPrimary={true}
                    />
                    <MobileNavLink
                        to="/ai-coach"
                        icon={BrainCircuit}
                        label="AI Coach"
                    />

                    {!isPremium && !subLoading && (
                        <div className="pt-2 mt-2 border-t border-zinc-800">
                            <button
                                onClick={() => { setIsMobileMenuOpen(false); navigate('/pricing'); }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium text-sm shadow-lg"
                            >
                                <Sparkles className="w-4 h-4" />
                                Upgrade to Pro
                            </button>
                        </div>
                    )}
                </div>
            )}

            <UserProfileDialog
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
            />
        </header>
    );
}
