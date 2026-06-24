import { isNativePlatform } from './platform';
import { supabase } from './supabase';
import { Health } from '@capgo/capacitor-health';

/**
 * Mock data for web fallback
 */
const getMockWearableData = () => ({
    steps: Math.floor(Math.random() * 5000) + 5000,
    sleepHours: (Math.random() * 3 + 5).toFixed(1),
    activeEnergy: Math.floor(Math.random() * 500) + 200,
    isMock: true
});

/**
 * Requests permissions for health data (steps, sleep, energy)
 */
export const requestHealthPermissions = async () => {
    if (!isNativePlatform()) {
        console.log('Web fallback: Auto-granting mock health permissions');
        return true;
    }

    try {
        const availableResult = await Health.isAvailable();
        if (!availableResult.available) {
            console.error('Health Connect is not available on this device:', availableResult.reason);
            return { message: availableResult.reason || "Health Connect is not available" };
        }

        try {
            await Health.requestAuthorization({
                read: ['steps', 'sleep', 'calories']
            });
            return true;
        } catch(err) {
            console.error('requestAuthorization error:', err.message);
            return { message: err.message };
        }
    } catch (e) {
        console.error('Outer error:', e.message);
        return { message: e.message || "Failed to request health permissions" };
    }
};

/**
 * Fetches today's health data
 */
export const fetchDailyHealthData = async () => {
    if (!isNativePlatform()) {
        return getMockWearableData();
    }

    try {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date();
        
        // Sleep sessions typically start the previous evening (e.g. 10 PM → 6 AM).
        // Query from yesterday 6 PM to capture the full overnight window.
        const sleepStartDate = new Date();
        sleepStartDate.setDate(sleepStartDate.getDate() - 1);
        sleepStartDate.setHours(18, 0, 0, 0);

        let steps = 0;
        let sleepHours = 0;
        let activeEnergy = 0;

        try {
            const stepsResult = await Health.queryAggregated({
                dataType: 'steps',
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                bucket: 'day',
            });
            steps = stepsResult.samples?.reduce((acc, entry) => acc + (entry.value || 0), 0) || 0;
        } catch(e) { console.warn('Could not read steps', e); }

        try {
            const sleepResult = await Health.readSamples({
                dataType: 'sleep',
                startDate: sleepStartDate.toISOString(),
                endDate: endDate.toISOString(),
            });
            // Calculate total sleep duration, only counting sessions that end today
            const todayStart = startDate.getTime();
            const totalSleepMs = sleepResult.samples?.reduce((acc, entry) => {
               const entryEnd = new Date(entry.endDate).getTime();
               // Only count sleep sessions that ended today (not yesterday evening naps)
               if (entryEnd < todayStart) return acc;
               
               // Exclude awake periods if the platform provides stage data
               if (entry.sleepState === 'awake' || entry.stage === 'awake') return acc;
               
               const start = new Date(entry.startDate).getTime();
               const end = entryEnd;
               return acc + (end - start);
            }, 0) || 0;
            sleepHours = (totalSleepMs / (1000 * 60 * 60)).toFixed(1);
        } catch(e) { console.warn('Could not read sleep', e); }

        try {
            const energyResult = await Health.queryAggregated({
                dataType: 'calories',
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                bucket: 'day',
            });
            activeEnergy = energyResult.samples?.reduce((acc, entry) => acc + (entry.value || 0), 0) || 0;
        } catch(e) { console.warn('Could not read active energy', e); }

        return {
            steps: Math.floor(steps),
            sleepHours: parseFloat(sleepHours),
            activeEnergy: Math.floor(activeEnergy),
            isMock: false
        };
    } catch (e) {
        console.error('Failed to fetch health data', e);
        return getMockWearableData();
    }
};

/**
 * Opens the native Health Connect settings screen so users can manage/revoke permissions
 */
export const openHealthSettings = async () => {
    if (!isNativePlatform()) return;
    try {
        await Health.openHealthConnectSettings();
    } catch (e) {
        console.error('Could not open health settings:', e);
    }
};

/**
 * Checks for newly unlocked achievements after a workout is saved.
 * @param {string} userId - The user ID
 * @param {object} workoutData - The just-saved workout data
 * @param {Array} workoutLogs - All historical workout logs (including the new one)
 * @returns {Array} List of newly unlocked achievements
 */
export const checkAndAwardAchievements = async (userId, workoutData, workoutLogs) => {
    if (!userId || !workoutData) return [];

    try {
        // 1. Fetch all available achievements
        const { data: achievements } = await supabase.from('achievements').select('*');
        if (!achievements) return [];

        // 2. Fetch user's existing badges
        const { data: existingBadges } = await supabase
            .from('user_badges')
            .select('achievement_id')
            .eq('user_id', userId);
        
        const unlockedIds = new Set((existingBadges || []).map(b => b.achievement_id));
        const newUnlocks = [];

        // Calculate current stats
        const totalWorkouts = workoutLogs.length;
        
        let currentWorkoutVolume = 0;
        if (workoutData.exercises) {
             Object.values(workoutData.exercises).forEach(sets => {
                 if (Array.isArray(sets)) {
                     sets.forEach(set => {
                         currentWorkoutVolume += (parseFloat(set.weight) || 0) * (parseFloat(set.reps) || 0);
                     });
                 }
             });
        }

        // Calculate streak (consecutive days)
        let currentStreak = 0;
        if (workoutLogs.length > 0) {
            const sortedDates = [...new Set(workoutLogs.map(l => new Date(l.date).toDateString()))]
                .map(d => new Date(d))
                .sort((a, b) => b - a); // newest first
            
            let checkDate = new Date();
            checkDate.setHours(0,0,0,0);
            
            // Allow today or yesterday for an active streak
            const firstLogDate = sortedDates[0];
            firstLogDate.setHours(0,0,0,0);
            
            const diffDays = Math.floor((checkDate - firstLogDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 1) {
                currentStreak = 1;
                let currentDate = new Date(firstLogDate);
                
                for (let i = 1; i < sortedDates.length; i++) {
                    currentDate.setDate(currentDate.getDate() - 1);
                    const logDate = sortedDates[i];
                    logDate.setHours(0,0,0,0);
                    
                    if (logDate.getTime() === currentDate.getTime()) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
            }
        }

        // 3. Check each achievement
        for (const achievement of achievements) {
            if (unlockedIds.has(achievement.id)) continue; // Already unlocked

            let isUnlocked = false;
            
            switch (achievement.requirement_type) {
                case 'workouts_count':
                    if (totalWorkouts >= achievement.requirement_value) isUnlocked = true;
                    break;
                case 'workout_volume':
                    if (currentWorkoutVolume >= achievement.requirement_value) isUnlocked = true;
                    break;
                case 'streak':
                    if (currentStreak >= achievement.requirement_value) isUnlocked = true;
                    break;
            }

            if (isUnlocked) {
                // Award badge
                const { error } = await supabase
                    .from('user_badges')
                    .insert({ user_id: userId, achievement_id: achievement.id });
                
                if (!error) {
                    newUnlocks.push(achievement);
                }
            }
        }

        return newUnlocks;

    } catch (e) {
        console.error("Failed to check achievements", e);
        return [];
    }
};
