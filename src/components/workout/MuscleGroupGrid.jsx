import React from 'react';
import { Dumbbell, PersonStanding, BicepsFlexed, Footprints, HeartPulse, Activity } from 'lucide-react';

const CATEGORIES = [
    { id: 'Chest', label: 'Chest', icon: Dumbbell, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'Back', label: 'Back', icon: PersonStanding, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'Shoulders', label: 'Shoulders', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'Arms', label: 'Arms', icon: BicepsFlexed, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'Legs', label: 'Legs', icon: Footprints, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'Cardio', label: 'Cardio', icon: HeartPulse, color: 'text-pink-500', bg: 'bg-pink-500/10' },
];

export function MuscleGroupGrid({ onSelect }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {CATEGORIES.map((cat) => (
                <button
                    key={cat.id}
                    onClick={() => onSelect(cat.id)}
                    className="group relative flex flex-col items-center justify-center p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-300"
                >
                    <div className={`w-16 h-16 rounded-full ${cat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <cat.icon className={`w-8 h-8 ${cat.color}`} />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-200 group-hover:text-white">{cat.label}</h3>
                    <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">Start Workout</p>
                </button>
            ))}
        </div>
    );
}
