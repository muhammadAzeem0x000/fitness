import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Check, Info } from 'lucide-react';
import { Button } from '../ui/Button';
import { MuscleIcon } from '../ui/MuscleIcon';
import { useBackInterceptor } from '../../hooks/useHardwareBackButton';
import { getExerciseDataBatch, formatEquipment, formatTarget, getExerciseLibrary } from '../../lib/exerciseImages';
import { ExerciseDetailModal } from './ExerciseDetailModal';

export function ExercisePicker({ availableExercises, onComplete, onBack, initialSelection = [] }) {
    const [selected, setSelected] = useState(initialSelection);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [customInputs, setCustomInputs] = useState([]); // List of custom added strings
    const [libraryExercises, setLibraryExercises] = useState([]);
    const [exerciseImageData, setExerciseImageData] = useState(new Map());
    const [detailExercise, setDetailExercise] = useState(null);
    const [visibleCount, setVisibleCount] = useState(50);
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);

    useBackInterceptor(() => {
        onBack();
    });

    // Load the full exercise library from the service
    useEffect(() => {
        setIsLoadingLibrary(true);
        getExerciseLibrary().then(data => {
            if (data && data.length > 0) {
                setLibraryExercises(data);
                const map = new Map();
                data.forEach(ex => {
                    map.set(ex.name, ex);
                });
                setExerciseImageData(map);
            }
            setIsLoadingLibrary(false);
        }).catch(() => {
            setIsLoadingLibrary(false);
        });
    }, []);

    // Combine prop availableExercises with full library
    const fullExerciseList = useMemo(() => {
        return libraryExercises.length > 0 ? libraryExercises : availableExercises;
    }, [libraryExercises, availableExercises]);

    // 15 Most Frequent (In our case, just the first 15 seeded)
    // The prop `availableExercises` should ideally be sorted by frequency or just be the static list for now.

    // Sort logic: if we had frequency data, we'd sort here. 
    // For now, assume availableExercises is the full list.

    // Category icons are now handled by MuscleIcon component

    // Extract unique categories for filter tabs
    const categories = useMemo(() => {
        const cats = new Set(fullExerciseList.map(e => e.category));
        return ['All', ...Array.from(cats).filter(Boolean).sort()];
    }, [fullExerciseList]);

    const filtered = useMemo(() => {
        let list = fullExerciseList;
        
        // Filter by category
        if (activeCategory !== 'All') {
            list = list.filter(ex => ex.category === activeCategory);
        }

        // Filter by search
        if (search) {
            list = list.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase()));
        }
        return list;
    }, [fullExerciseList, search, activeCategory]);

    const handleToggle = (name) => {
        setSelected(prev => {
            if (prev.includes(name)) return prev.filter(i => i !== name);
            return [...prev, name];
        });
    };

    const handleAddCustom = () => {
        if (!search.trim()) return;
        
        const searchLower = search.trim().toLowerCase();
        
        // 1. Check if it already exists in the database list
        const existingEx = availableExercises.find(ex => ex.name.toLowerCase() === searchLower);
        if (existingEx) {
            if (!selected.includes(existingEx.name)) {
                setSelected(prev => [...prev, existingEx.name]);
            }
            setSearch('');
            return;
        }

        // 2. Check if it's already a custom input
        const existingCustom = customInputs.find(c => c.toLowerCase() === searchLower);
        if (existingCustom) {
            if (!selected.includes(existingCustom)) {
                setSelected(prev => [...prev, existingCustom]);
            }
            setSearch('');
            return;
        }

        // 3. Add as new custom input
        const newCustom = search.trim();
        setCustomInputs(prev => [...prev, newCustom]);
        setSelected(prev => [...prev, newCustom]);
        setSearch('');
    };

    const handleFinish = () => {
        // Combine selected DB exercises + custom ones
        // Actually custom ones are already in `selected` if we added them.
        onComplete(selected);
    };

    return (
        <div className="fixed top-[56px] left-0 right-0 bottom-0 z-[60] bg-slate-50 dark:bg-slate-900 flex flex-col px-3 md:px-6 pb-2 animate-in slide-in-from-right-8 duration-500">
            {/* Header Section (Fixed) */}
            <div className="flex-none space-y-4 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Select Exercises</h2>
                        <p className="text-slate-500 dark:text-zinc-400 text-xs md:text-sm">Choose exercises or add your own.</p>
                    </div>
                    <Button variant="ghost" onClick={onBack}>Back</Button>
                </div>

                {/* Search / Custom Add */}
                <div className="relative z-10">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search or type to add custom..."
                        className="w-full h-12 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-xl pl-10 pr-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
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

                {/* Category Filters */}
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                    {categories.map(cat => {
                        return (
                            <button
                                key={cat}
                                onClick={() => {
                                    setActiveCategory(cat);
                                    setVisibleCount(50); // Reset pagination on filter change
                                }}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                                    activeCategory === cat
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-300 dark:hover:bg-zinc-700 hover:text-slate-900 dark:hover:text-white border border-transparent'
                                }`}
                            >
                                <MuscleIcon category={cat} active={activeCategory === cat} className="w-5 h-5 opacity-90" />
                                <span className="capitalize">{cat}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* List Section (Scrollable) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pr-2 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Render Custom Inputs ONLY if they match the active category filter (Custom goes to 'All' or 'Core/Default' if we wanted, but let's show them in All or if no categories are filtered) */}
                    {(activeCategory === 'All') && customInputs.map((custom, idx) => (
                        <div key={`custom-${idx}`} className="flex items-center justify-between p-4 rounded-xl border border-blue-500/50 bg-blue-500/10 text-slate-900 dark:text-white shrink-0">
                            <div className="flex items-center gap-3">
                                <MuscleIcon category="All" className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                <span className="font-medium">{custom} <span className="text-xs text-blue-600 dark:text-blue-300 opacity-70 ml-1">(Custom)</span></span>
                            </div>
                            <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    ))}

                    {isLoadingLibrary ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-slate-500 dark:text-zinc-400 text-sm">Loading exercises...</p>
                        </div>
                    ) : (
                        filtered.slice(0, visibleCount).map(ex => {
                        const isSelected = selected.includes(ex.name);
                        const imgData = exerciseImageData.get(ex.name);
                        const thumbnailUrl = imgData?.image_url || imgData?.gif_url;
                        return (
                            <div key={ex.id} className="relative shrink-0">
                                <button
                                    onClick={() => handleToggle(ex.name)}
                                    className={`flex items-center w-full gap-3 p-3 rounded-xl border transition-all text-left ${isSelected
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                                        : 'bg-white dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-200'
                                        }`}
                                >
                                    {/* Thumbnail or Fallback Icon */}
                                    {thumbnailUrl ? (
                                        <div className={`w-12 h-12 rounded-full overflow-hidden flex-none border ${isSelected ? 'border-blue-400/50' : 'border-slate-200 dark:border-zinc-700'}`}>
                                            <img
                                                src={thumbnailUrl}
                                                alt={ex.name}
                                                loading="lazy"
                                                className="w-full h-full object-cover hd-image"
                                            />
                                        </div>
                                    ) : (
                                        <div className={`w-12 h-12 rounded-full flex-none flex items-center justify-center text-xl overflow-hidden ${isSelected ? 'bg-blue-500/30 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>
                                            <MuscleIcon category={ex.category} active={isSelected} className="w-full h-full" />
                                        </div>
                                    )}

                                    {/* Text Content */}
                                    <div className="flex-1 min-w-0">
                                        <span className="font-medium text-sm block truncate capitalize">{ex.name}</span>
                                        {imgData && (
                                            <span className={`text-xs block truncate mt-0.5 ${isSelected ? 'text-blue-200' : 'text-slate-400 dark:text-zinc-500'}`}>
                                                {formatTarget(imgData.target)}{imgData.equipment ? ` • ${formatEquipment(imgData.equipment)}` : ''}
                                            </span>
                                        )}
                                    </div>

                                    {/* Selection indicator */}
                                    <div className="flex items-center gap-1 flex-none">
                                        {isSelected && <Check className="w-5 h-5 text-white" />}
                                    </div>
                                </button>

                                {/* Info button for exercise details */}
                                {imgData && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDetailExercise(ex.name); }}
                                        className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${isSelected ? 'text-blue-200 hover:text-white hover:bg-blue-500/30' : 'text-slate-300 dark:text-zinc-600 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
                                        title="View exercise details"
                                    >
                                        <Info className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        );
                    })
                    )}
                </div>
                
                {/* Lazy Load More Button */}
                {!isLoadingLibrary && visibleCount < filtered.length && (
                    <div className="mt-6 flex justify-center pb-4">
                        <Button
                            variant="secondary"
                            onClick={() => setVisibleCount(c => c + 50)}
                            className="bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-700"
                        >
                            Load More Exercises ({filtered.length - visibleCount} remaining)
                        </Button>
                    </div>
                )}
            </div>

            {/* Footer Action (Fixed) */}
            <div className="flex-none pt-4 border-t border-slate-200 dark:border-zinc-800 text-right bg-slate-50 dark:bg-slate-900 mt-auto">
                <Button
                    onClick={handleFinish}
                    disabled={selected.length === 0}
                    className="w-full md:w-auto px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20"
                >
                    Start Logging ({selected.length})
                </Button>
            </div>

            {/* Exercise Detail Modal */}
            <ExerciseDetailModal
                isOpen={!!detailExercise}
                onClose={() => setDetailExercise(null)}
                exerciseName={detailExercise}
            />
        </div>
    );
}
