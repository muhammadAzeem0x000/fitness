import React, { useState } from 'react';
import { Lock, Check, X } from 'lucide-react';
import { BADGE_DEFINITIONS } from '../../hooks/useGamification';
import * as Icons from 'lucide-react';

export function AchievementBadges({ unlockedBadges, badgeProgress, newlyUnlocked, clearNewlyUnlocked }) {
    const [selectedBadge, setSelectedBadge] = useState(null);

    // Show toast for newly unlocked
    const newBadge = newlyUnlocked && newlyUnlocked.length > 0 ? BADGE_DEFINITIONS.find(b => b.id === newlyUnlocked[0]) : null;

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Achievements</h3>
                <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                    {unlockedBadges.length} / {BADGE_DEFINITIONS.length} Unlocked
                </span>
            </div>

            <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-4 snap-x no-scrollbar">
                {BADGE_DEFINITIONS.map(badge => {
                    const isUnlocked = unlockedBadges.includes(badge.id);
                    const progress = badgeProgress[badge.id] || 0;
                    const Icon = Icons[badge.icon];

                    return (
                        <button
                            key={badge.id}
                            onClick={() => setSelectedBadge(badge)}
                            className="snap-start shrink-0 flex flex-col items-center gap-2 w-20 active:scale-95 transition-transform"
                        >
                            <div className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-sm border-2 transition-all duration-300 ${isUnlocked ? `${badge.color} border-white dark:border-zinc-800 shadow-md` : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700'}`}>
                                {isUnlocked ? (
                                    <Icon className="w-8 h-8 text-white drop-shadow" />
                                ) : (
                                    <Lock className="w-6 h-6 text-slate-400 dark:text-zinc-500" />
                                )}
                                
                                {!isUnlocked && progress > 0 && (
                                    <div className="absolute inset-0 rounded-full border-2 border-slate-300 dark:border-zinc-600" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${progress}%, 0 ${progress}%)` }}></div>
                                )}
                            </div>
                            <span className={`text-xs font-medium text-center leading-tight ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-zinc-500'}`}>
                                {badge.name}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Selected Badge Modal */}
            {selectedBadge && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedBadge(null)}>
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedBadge(null)} className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-zinc-800 rounded-full text-slate-500">
                            <X className="w-4 h-4" />
                        </button>
                        
                        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-zinc-800 mb-4 ${unlockedBadges.includes(selectedBadge.id) ? selectedBadge.color : 'bg-slate-200 dark:bg-zinc-800'}`}>
                            {React.createElement(Icons[selectedBadge.icon], { 
                                className: `w-12 h-12 ${unlockedBadges.includes(selectedBadge.id) ? 'text-white' : 'text-slate-400 dark:text-zinc-500'}` 
                            })}
                        </div>
                        
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{selectedBadge.name}</h3>
                        <p className="text-slate-500 dark:text-zinc-400 mb-6">{selectedBadge.description}</p>
                        
                        {unlockedBadges.includes(selectedBadge.id) ? (
                            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-bold text-sm">
                                <Check className="w-4 h-4" /> Unlocked
                            </div>
                        ) : (
                            <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-3 mb-1 overflow-hidden relative">
                                <div 
                                    className={`absolute top-0 left-0 h-full rounded-full ${selectedBadge.color}`}
                                    style={{ width: `${badgeProgress[selectedBadge.id] || 0}%` }}
                                ></div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* New Badge Unlocked Toast/Modal */}
            {newBadge && (
                <div className="fixed bottom-20 left-4 right-4 z-[150] bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 p-4 flex items-center gap-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${newBadge.color}`}>
                        {React.createElement(Icons[newBadge.icon], { className: "w-6 h-6 text-white" })}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">Badge Unlocked!</p>
                        <h4 className="text-slate-900 dark:text-white font-bold truncate">{newBadge.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">{newBadge.description}</p>
                    </div>
                    <button onClick={clearNewlyUnlocked} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
