import { useMemo, useEffect } from 'react';
import { useWorkouts } from './useWorkouts';
import { useAuth } from './useAuth';
import { useLocalStorage } from './useLocalStorage';

export const BADGE_DEFINITIONS = [
    { id: 'first_workout', name: 'First Workout', description: 'Log your first workout', icon: 'Flame', color: 'bg-orange-500' },
    { id: 'iron_starter', name: 'Iron Starter', description: 'Log 10 workouts', icon: 'Dumbbell', color: 'bg-slate-500' },
    { id: 'gym_rat', name: 'Gym Rat', description: 'Log 50 workouts', icon: 'Dumbbell', color: 'bg-blue-500' },
    { id: 'century_club', name: 'Century Club', description: 'Log 100 workouts', icon: 'Crown', color: 'bg-yellow-500' },
    { id: 'week_warrior', name: 'Week Warrior', description: '7-day streak', icon: 'Calendar', color: 'bg-emerald-500' },
    { id: 'monthly_machine', name: 'Monthly Machine', description: '30-day streak', icon: 'Flame', color: 'bg-red-500' },
    { id: 'volume_king', name: 'Volume King', description: 'Lift 100,000 lbs total', icon: 'Zap', color: 'bg-purple-500' },
    { id: 'mountain_mover', name: 'Mountain Mover', description: 'Lift 500,000 lbs total', icon: 'Mountain', color: 'bg-indigo-500' },
    { id: 'early_bird', name: 'Early Bird', description: 'Log workout before 7 AM', icon: 'Sunrise', color: 'bg-amber-400' },
    { id: 'night_owl', name: 'Night Owl', description: 'Log workout after 9 PM', icon: 'Moon', color: 'bg-indigo-800' },
    { id: 'consistency_pro', name: 'Consistency Pro', description: 'Work out ≥3 days/week for 4 weeks', icon: 'Target', color: 'bg-green-600' },
    { id: 'pr_hunter', name: 'PR Hunter', description: 'Set 5 personal records', icon: 'TrendingUp', color: 'bg-pink-500' },
    { id: 'template_master', name: 'Template Master', description: 'Create 5 custom templates', icon: 'Layout', color: 'bg-teal-500' },
    { id: 'ai_explorer', name: 'AI Explorer', description: 'Generate 3 AI workouts', icon: 'Sparkles', color: 'bg-cyan-500' },
    { id: 'data_nerd', name: 'Data Nerd', description: 'Log workouts for 3+ different muscle groups', icon: 'BarChart', color: 'bg-blue-600' }
];

export function useGamification() {
    const { user } = useAuth();
    const { workoutLogs = [], routines = [] } = useWorkouts(user?.id);
    const [unlockedBadgesStorage, setUnlockedBadgesStorage] = useLocalStorage('unlocked_badges', []);
    const [newlyUnlocked, setNewlyUnlocked] = useLocalStorage('newly_unlocked_badges', []);

    const gamificationData = useMemo(() => {
        if (!workoutLogs || workoutLogs.length === 0) {
            return {
                level: 1,
                xp: 0,
                progressToNextLevel: 0,
                currentStreak: 0,
                longestStreak: 0,
                totalVolume: 0,
                monthVolume: 0,
                unlockedBadges: [],
                badgeProgress: {},
                heatmapData: {}
            };
        }

        let totalVolume = 0;
        let monthVolume = 0;
        let aiWorkoutCount = 0;
        let prCount = 0; // Simplified for now, usually requires deep history analysis
        const muscleGroups = new Set();
        let earlyBird = false;
        let nightOwl = false;

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const heatmapData = {};
        const activeDays = new Set();

        // Analyze logs
        workoutLogs.forEach(log => {
            const logDate = new Date(log.date);
            const dateString = logDate.toISOString().split('T')[0];
            heatmapData[dateString] = (heatmapData[dateString] || 0) + 1;
            activeDays.add(dateString);

            // Time checks
            const hour = logDate.getHours();
            if (hour < 7) earlyBird = true;
            if (hour >= 21) nightOwl = true;

            if (log.source === 'ai') aiWorkoutCount++;

            // Volume and muscle groups
            if (log.exercises) {
                Object.entries(log.exercises).forEach(([name, sets]) => {
                    // Simple muscle group inference (in a real app, we'd map exercise name to muscle)
                    muscleGroups.add(name.split(' ')[0]); 
                    
                    if (Array.isArray(sets)) {
                        sets.forEach(set => {
                            const w = parseFloat(set.weight) || 0;
                            const r = parseFloat(set.reps) || 0;
                            const vol = w * r;
                            totalVolume += vol;
                            if (logDate >= thirtyDaysAgo) {
                                monthVolume += vol;
                            }
                        });
                    }
                });
            }
        });

        // Calculate Level (1 level per 10k volume)
        const level = Math.floor(totalVolume / 10000) + 1;
        const currentLevelVolume = totalVolume % 10000;
        const progressToNextLevel = (currentLevelVolume / 10000) * 100;

        // Calculate Streaks (Days)
        const sortedDates = Array.from(activeDays).sort((a, b) => new Date(b) - new Date(a));
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        
        if (sortedDates.length > 0) {
            const todayStr = now.toISOString().split('T')[0];
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            let checkDate = new Date(sortedDates[0]);
            
            // Current streak
            if (sortedDates[0] === todayStr || sortedDates[0] === yesterdayStr) {
                currentStreak = 1;
                for (let i = 1; i < sortedDates.length; i++) {
                    const prevDate = new Date(sortedDates[i]);
                    const diffDays = Math.round((checkDate - prevDate) / (1000 * 60 * 60 * 24));
                    if (diffDays === 1) {
                        currentStreak++;
                        checkDate = prevDate;
                    } else {
                        break;
                    }
                }
            }

            // Longest streak
            tempStreak = 1;
            longestStreak = 1;
            for (let i = 1; i < sortedDates.length; i++) {
                const curr = new Date(sortedDates[i-1]);
                const prev = new Date(sortedDates[i]);
                const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    tempStreak++;
                    if (tempStreak > longestStreak) longestStreak = tempStreak;
                } else {
                    tempStreak = 1;
                }
            }
        }

        // Evaluate Badges
        const unlocked = [];
        const progress = {};
        const logCount = workoutLogs.length;

        if (logCount >= 1) unlocked.push('first_workout');
        
        progress['iron_starter'] = Math.min(100, (logCount / 10) * 100);
        if (logCount >= 10) unlocked.push('iron_starter');
        
        progress['gym_rat'] = Math.min(100, (logCount / 50) * 100);
        if (logCount >= 50) unlocked.push('gym_rat');
        
        progress['century_club'] = Math.min(100, (logCount / 100) * 100);
        if (logCount >= 100) unlocked.push('century_club');

        progress['week_warrior'] = Math.min(100, (longestStreak / 7) * 100);
        if (longestStreak >= 7) unlocked.push('week_warrior');
        
        progress['monthly_machine'] = Math.min(100, (longestStreak / 30) * 100);
        if (longestStreak >= 30) unlocked.push('monthly_machine');

        progress['volume_king'] = Math.min(100, (totalVolume / 100000) * 100);
        if (totalVolume >= 100000) unlocked.push('volume_king');
        
        progress['mountain_mover'] = Math.min(100, (totalVolume / 500000) * 100);
        if (totalVolume >= 500000) unlocked.push('mountain_mover');

        if (earlyBird) unlocked.push('early_bird');
        if (nightOwl) unlocked.push('night_owl');

        progress['template_master'] = Math.min(100, (routines.length / 5) * 100);
        if (routines.length >= 5) unlocked.push('template_master');

        progress['ai_explorer'] = Math.min(100, (aiWorkoutCount / 3) * 100);
        if (aiWorkoutCount >= 3) unlocked.push('ai_explorer');

        progress['data_nerd'] = Math.min(100, (muscleGroups.size / 3) * 100);
        if (muscleGroups.size >= 3) unlocked.push('data_nerd');

        return {
            level,
            xp: currentLevelVolume,
            progressToNextLevel,
            currentStreak,
            longestStreak,
            totalVolume,
            monthVolume,
            unlockedBadges: unlocked,
            badgeProgress: progress,
            heatmapData
        };

    }, [workoutLogs, routines]);

    // Check for newly unlocked badges
    useEffect(() => {
        const newly = gamificationData.unlockedBadges.filter(b => !unlockedBadgesStorage.includes(b));
        if (newly.length > 0) {
            setUnlockedBadgesStorage([...unlockedBadgesStorage, ...newly]);
            setNewlyUnlocked([...newlyUnlocked, ...newly]);
        }
    }, [gamificationData.unlockedBadges, unlockedBadgesStorage]);

    const clearNewlyUnlocked = () => setNewlyUnlocked([]);

    return {
        ...gamificationData,
        newlyUnlocked,
        clearNewlyUnlocked
    };
}
