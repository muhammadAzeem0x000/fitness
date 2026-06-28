import React from 'react';
import { Trophy, Flame, Calendar, Dumbbell } from 'lucide-react';

export function PersonalStatsHero({ gamificationData, currentRank }) {
    const { level, progressToNextLevel, currentStreak, longestStreak, monthVolume } = gamificationData;

    return (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl mb-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-blue-400 opacity-20 rounded-full blur-xl"></div>

            <div className="relative z-10 flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-blue-100 font-medium text-sm tracking-wider uppercase mb-1">Your Rank</h2>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black">{currentRank ? `#${currentRank}` : 'Unranked'}</span>
                        <span className="text-blue-200 font-medium">Global</span>
                    </div>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                    <Trophy className="w-8 h-8 text-yellow-300 drop-shadow-md" />
                </div>
            </div>

            <div className="space-y-2 mb-6">
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                        <div className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold text-white tracking-wider border border-white/20">
                            LVL {level}
                        </div>
                        <span className="text-sm text-blue-100 font-medium">Muscle Builder</span>
                    </div>
                    <span className="text-xs text-blue-200">{Math.round(progressToNextLevel)}%</span>
                </div>
                <div className="h-2.5 w-full bg-black/20 rounded-full overflow-hidden border border-black/10">
                    <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full relative"
                        style={{ width: `${Math.max(2, progressToNextLevel)}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite] -skew-x-12"></div>
                    </div>
                </div>
                <p className="text-[10px] text-blue-200 text-right">Progress to Level {level + 1}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="bg-black/10 rounded-xl p-3 border border-white/5 backdrop-blur-sm flex flex-col items-center justify-center text-center">
                    <Flame className="w-5 h-5 text-orange-400 mb-1" />
                    <span className="text-xl font-bold">{currentStreak}</span>
                    <span className="text-[9px] text-blue-200 uppercase tracking-wider">Wk Streak</span>
                </div>
                <div className="bg-black/10 rounded-xl p-3 border border-white/5 backdrop-blur-sm flex flex-col items-center justify-center text-center">
                    <Calendar className="w-5 h-5 text-emerald-400 mb-1" />
                    <span className="text-xl font-bold">{longestStreak}</span>
                    <span className="text-[9px] text-blue-200 uppercase tracking-wider">Best Streak</span>
                </div>
                <div className="bg-black/10 rounded-xl p-3 border border-white/5 backdrop-blur-sm flex flex-col items-center justify-center text-center">
                    <Dumbbell className="w-5 h-5 text-blue-300 mb-1" />
                    <span className="text-xl font-bold">{(monthVolume / 1000).toFixed(1)}k</span>
                    <span className="text-[9px] text-blue-200 uppercase tracking-wider">Vol (Lbs)</span>
                </div>
            </div>
        </div>
    );
}
