import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Sun, Moon, Monitor } from 'lucide-react';

export const ThemeToggle = ({ className = '' }) => {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        if (theme === 'light') {
            setTheme('dark');
        } else if (theme === 'dark') {
            setTheme('system');
        } else {
            setTheme('light');
        }
    };

    const renderIcon = () => {
        switch (theme) {
            case 'light':
                return <Sun className="w-5 h-5 text-amber-500" />;
            case 'dark':
                return <Moon className="w-5 h-5 text-indigo-400" />;
            case 'system':
                return <Monitor className="w-5 h-5 text-slate-500 dark:text-slate-400" />;
            default:
                return <Sun className="w-5 h-5" />;
        }
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
