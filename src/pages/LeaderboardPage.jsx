import React, { useState } from 'react';
import { Trophy, TrendingUp } from 'lucide-react';
import { useGamification } from '../hooks/useGamification';
import { PersonalStatsHero } from '../components/rank/PersonalStatsHero';
import { AchievementBadges } from '../components/rank/AchievementBadges';
import { StreakHeatmap } from '../components/rank/StreakHeatmap';
import { LeaderboardTabs } from '../components/rank/LeaderboardTabs';

export function LeaderboardPage() {
    const gamificationData = useGamification();
    const [currentGlobalRank, setCurrentGlobalRank] = useState(null);

    return (
        <div className="pt-8 px-4 pb-24 animate-in fade-in duration-500 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Ranks & Stats</h2>
                    <p className="text-slate-500 dark:text-zinc-400">Your journey and achievements</p>
                </div>
            </div>

            {/* Personal Stats Hero */}
            <PersonalStatsHero 
                gamificationData={gamificationData} 
                currentRank={currentGlobalRank} 
            />

            {/* Achievement Badges */}
            <AchievementBadges 
                unlockedBadges={gamificationData.unlockedBadges} 
                badgeProgress={gamificationData.badgeProgress}
                newlyUnlocked={gamificationData.newlyUnlocked}
                clearNewlyUnlocked={gamificationData.clearNewlyUnlocked}
            />

            {/* Tabbed Leaderboards */}
            <LeaderboardTabs 
                onCurrentRankUpdate={setCurrentGlobalRank} 
            />

            {/* Streak Heatmap */}
            <StreakHeatmap 
                heatmapData={gamificationData.heatmapData} 
            />

            {/* Motivation Banner */}
            <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100">Keep pushing!</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Every workout gets you closer to the next milestone and badge. Stay consistent!</p>
                </div>
            </div>
        </div>
    );
}
