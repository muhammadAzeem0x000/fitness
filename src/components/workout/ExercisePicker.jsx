import React, { useState, useMemo } from 'react';
import { Search, Plus, Check } from 'lucide-react';
import { Button } from '../ui/Button';

export function ExercisePicker({ category, availableExercises, onComplete, onBack }) {
    const [selected, setSelected] = useState([]);
    const [search, setSearch] = useState('');
    const [customInputs, setCustomInputs] = useState([]); // List of custom added strings

    // 15 Most Frequent (In our case, just the first 15 seeded)
    // The prop `availableExercises` should ideally be sorted by frequency or just be the static list for now.

    // Sort logic: if we had frequency data, we'd sort here. 
    // For now, assume availableExercises is the full list.

    const filtered = useMemo(() => {
        let list = availableExercises;
        if (search) {
            list = list.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase()));
        }
        return list;
    }, [availableExercises, search]);

    const handleToggle = (name) => {
        setSelected(prev => {
            if (prev.includes(name)) return prev.filter(i => i !== name);
            return [...prev, name];
        });
    };

    const handleAddCustom = () => {
        if (!search) return;
        setCustomInputs(prev => [...prev, search]);
        setSelected(prev => [...prev, search]);
        setSearch('');
    };

    const handleFinish = () => {
        // Combine selected DB exercises + custom ones
        // Actually custom ones are already in `selected` if we added them.
        onComplete(selected);
    };

    return (
        <div className="animate-in slide-in-from-right-8 duration-500 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Select {category} Exercises</h2>
                    <p className="text-zinc-400">Choose exercises or add your own.</p>
                </div>
                <Button variant="ghost" onClick={onBack}>Back</Button>
            </div>

            {/* Search / Custom Add */}
            <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search or type to add custom..."
                    className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-zinc-600"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCustom();
                    }}
                />
                {search && filtered.length === 0 && (
                    <Button
                        size="sm"
                        onClick={handleAddCustom}
                        className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-500"
                    >
                        <Plus className="w-4 h-4 mr-1" /> Add "{search}"
                    </Button>
                )}
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {/* Custom Items appearing first */}
                {customInputs.map((custom, idx) => (
                    <div key={`custom-${idx}`} className="flex items-center justify-between p-4 rounded-xl border border-blue-500/50 bg-blue-500/10 text-white">
                        <span>{custom} (Custom)</span>
                        <Check className="w-5 h-5 text-blue-400" />
                    </div>
                ))}

                {filtered.map(ex => {
                    const isSelected = selected.includes(ex.name);
                    return (
                        <button
                            key={ex.id}
                            onClick={() => handleToggle(ex.name)}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${isSelected
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                                }`}
                        >
                            <span className="font-medium">{ex.name}</span>
                            {isSelected && <Check className="w-5 h-5 text-white" />}
                        </button>
                    );
                })}
            </div>

            {/* Footer Action */}
            <div className="pt-4 border-t border-zinc-800 text-right">
                <Button
                    onClick={handleFinish}
                    disabled={selected.length === 0}
                    className="w-full md:w-auto px-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                    Start Logging ({selected.length})
                </Button>
            </div>
        </div>
    );
}
