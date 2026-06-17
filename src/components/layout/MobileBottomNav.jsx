import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, BrainCircuit, User } from 'lucide-react';
import { hapticLight } from '../../lib/haptics';

export function MobileBottomNav() {
    const location = useLocation();

    const NavItem = ({ to, icon: Icon, label, onClick }) => {
        const isActive = to ? location.pathname === to : false;
        
        const activeClass = isActive 
            ? "text-blue-500 font-semibold" 
            : "text-zinc-500 hover:text-zinc-300";

        const content = (
            <>
                <div className={`mb-1 p-1 rounded-full transition-colors ${isActive ? 'bg-blue-500/20' : ''}`}>
                    <Icon className={`w-6 h-6 ${isActive ? 'text-blue-500' : 'text-zinc-500'}`} />
                </div>
                <span className={`text-[10px] ${activeClass}`}>{label}</span>
            </>
        );

        const baseClass = "flex flex-col items-center justify-center flex-1 py-1 no-underline active:scale-95 transition-transform";

        if (onClick) {
            return (
                <button 
                    onClick={(e) => {
                        hapticLight();
                        onClick(e);
                    }} 
                    className={baseClass}
                >
                    {content}
                </button>
            );
        }

        return (
            <Link 
                to={to} 
                onClick={() => hapticLight()}
                className={baseClass}
            >
                {content}
            </Link>
        );
    };

    return (
        <nav 
            className="bg-slate-900 border-t border-zinc-800 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] w-full flex-none z-50"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            <div className="flex flex-row justify-around items-center h-16 px-1">
                <NavItem to="/dashboard" icon={LayoutDashboard} label="Training" />
                <NavItem to="/log" icon={PlusCircle} label="Workout" />
                <NavItem to="/ai-coach" icon={BrainCircuit} label="Insights" />
                <NavItem to="/profile" icon={User} label="Profile" />
            </div>
        </nav>
    );
}
