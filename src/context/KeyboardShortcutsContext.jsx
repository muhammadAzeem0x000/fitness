import React, { createContext, useContext, useState, useEffect } from 'react';
import { X } from 'lucide-react';

const KeyboardShortcutsContext = createContext();

export function KeyboardShortcutsProvider({ children }) {
    const [shortcuts] = useState({
        'mod+k': { description: 'Quick search (coming soon)', action: () => console.log('Search') },
        'mod+n': { description: 'New workout', action: () => window.location.href = '/log' },
        'mod+d': { description: 'Dashboard', action: () => window.location.href = '/' },
        'mod+a': { description: 'AI Coach', action: () => window.location.href = '/ai-coach' },
        '?': { description: 'Show shortcuts', action: null }, // handled separately
    });

    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const mod = e.metaKey || e.ctrlKey;
            const key = e.key.toLowerCase();

            // Show help
            if (key === '?' && !e.shiftKey) {
                setShowHelp(prev => !prev);
                e.preventDefault();
                return;
            }

            // Close help with Escape
            if (key === 'escape' && showHelp) {
                setShowHelp(false);
                return;
            }

            // Execute shortcuts
            Object.entries(shortcuts).forEach(([combo, { action }]) => {
                const [modPart, keyPart] = combo.split('+');

                if (modPart === 'mod' && mod && key === keyPart && action) {
                    e.preventDefault();
                    action();
                }
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts, showHelp]);

    return (
        <KeyboardShortcutsContext.Provider value={{ shortcuts, showHelp, setShowHelp }}>
            {children}
            {showHelp && <ShortcutsModal shortcuts={shortcuts} onClose={() => setShowHelp(false)} />}
        </KeyboardShortcutsContext.Provider>
    );
}

function ShortcutsModal({ shortcuts, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Keyboard Shortcuts</h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-2">
                    {Object.entries(shortcuts).map(([combo, { description }]) => (
                        <div key={combo} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                            <span className="text-zinc-300">{description}</span>
                            <kbd className="px-2 py-1 text-xs font-mono bg-zinc-800 border border-zinc-700 rounded text-zinc-300">
                                {combo.replace('mod', navigator.platform.includes('Mac') ? '⌘' : 'Ctrl')}
                            </kbd>
                        </div>
                    ))}
                </div>

                <p className="text-xs text-zinc-500 mt-4 text-center">
                    Press <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400">?</kbd> to toggle this menu
                </p>
            </div>
        </div>
    );
}

export function useKeyboardShortcuts() {
    return useContext(KeyboardShortcutsContext);
}
