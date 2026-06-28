import React, { createContext, useEffect, useState } from 'react';

export const ThemeContext = createContext({
    theme: 'dark',
    setTheme: () => null,
});

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const stored = localStorage.getItem('theme');
        return stored === 'light' || stored === 'dark' ? stored : 'dark';
    });

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove old classes
        root.classList.remove('light', 'dark');
        root.classList.add(theme);

        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
