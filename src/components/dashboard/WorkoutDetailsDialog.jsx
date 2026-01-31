import React from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Dumbbell, Hash, Scale } from 'lucide-react';

export function WorkoutDetailsDialog({ isOpen, onClose, workout }) {
    if (!isOpen || !workout) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal Wrapper */}
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl transition-all animate-in zoom-in-95 duration-200 relative">

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 z-50 p-2 rounded-full bg-black/20 text-zinc-400 hover:bg-black/40 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Header */}
                    <div className="bg-zinc-950/50 border-b border-zinc-800 p-6">
                        <h2 className="text-xl font-bold text-white tracking-tight mb-1">{workout.type}</h2>
                        <div className="flex items-center text-sm text-zinc-400 gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(workout.date).toLocaleDateString(undefined, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {workout.exercises && Object.entries(workout.exercises).map(([name, sets], index) => (
                            <div key={index} className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50">
                                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                                    <Dumbbell className="w-4 h-4 text-blue-500" />
                                    {name}
                                </h3>

                                <div className="space-y-2">
                                    {sets.map((set, sIndex) => (
                                        <div key={sIndex} className="flex items-center justify-between text-sm p-2 rounded bg-zinc-900/50 border border-zinc-800/50">
                                            <div className="flex items-center gap-3">
                                                <span className="text-zinc-500 font-mono text-xs w-6">#{sIndex + 1}</span>
                                                <div className="flex items-center gap-1.5 text-zinc-300">
                                                    <Scale className="w-3.5 h-3.5 text-zinc-500" />
                                                    <span className="font-medium text-white">{set.weight}</span> kg
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-zinc-300">
                                                <Hash className="w-3.5 h-3.5 text-zinc-500" />
                                                <span className="font-medium text-white">{set.reps}</span> reps
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {(!workout.exercises || Object.keys(workout.exercises).length === 0) && (
                            <p className="text-center text-zinc-500 py-4">No exercises logged for this session.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
