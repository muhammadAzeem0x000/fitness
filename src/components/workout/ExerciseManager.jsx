import React, { useState, useMemo } from 'react';
import { Search, Plus, Check, X } from 'lucide-react';
import { Button } from '../ui/Button';

export function ExerciseManager({ exercises, activeExercises, onToggleExercise, onAddCustom }) {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filtered = useMemo(() => {
        if (!search) return exercises;
        return exercises.filter(ex =>
            ex.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [exercises, search]);

    const handleCustomAdd = () => {
        if (!search) return;
        onAddCustom(search); // Parent handles object creation
        setSearch('');
    };

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                    Manage Exercises
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-xs h-8"
                >
                    {isOpen ? 'Close Manager' : 'Add / Remove Exercises'}
                </Button>
            </div>

            {isOpen && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search or type new exercise..."
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        {search && filtered.length === 0 && (
                            <Button onClick={handleCustomAdd} size="sm" className="bg-blue-600 hover:bg-blue-500">
                                <Plus className="w-4 h-4 mr-1" /> Add Custom
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                        {filtered.map(ex => {
                            const isActive = activeExercises.includes(ex.name);
                            return (
                                <button
                                    key={ex.id || ex.name}
                                    onClick={() => onToggleExercise(ex.name)}
                                    className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-all ${isActive
                                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-100'
                                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                                        }`}
                                >
                                    <span>{ex.name}</span>
                                    {isActive ? <Check className="w-4 h-4 text-blue-400" /> : <Plus className="w-4 h-4 opacity-50" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
