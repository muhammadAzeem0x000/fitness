import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = ({ className = '' }) => {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const renderIcon = () => {
        return theme === 'dark' 
            ? <Moon className="w-5 h-5 text-indigo-400" /> 
            : <Sun className="w-5 h-5 text-amber-500" />;
    };

    return (
        <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors ${className}`}
            aria-label="Toggle theme"
            title={`Current theme: ${theme}. Click to switch.`}
        >
            {renderIcon()}
        </button>
    );
};
