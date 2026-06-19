import React, { createContext, useEffect, useState } from 'react';

export const ThemeContext = createContext({
    theme: 'system',
    setTheme: () => null,
});

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const stored = localStorage.getItem('theme');
        return stored ? stored : 'system';
    });

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove old classes
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }

        localStorage.setItem('theme', theme);
    }, [theme]);

    // Listener for system preference changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = () => {
            if (theme === 'system') {
                const root = window.document.documentElement;
                root.classList.remove('light', 'dark');
                root.classList.add(mediaQuery.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
