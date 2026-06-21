import { isNativePlatform } from './platform';
import { supabase } from './supabase';

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
        // In a real app, you would use @capacitor-community/healthkit here
        // const { HealthKit } = await import('@capacitor-community/healthkit');
        // await HealthKit.requestAuthorization({ ... });
        return true;
    } catch (e) {
        console.error('Failed to request health permissions', e);
        return false;
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
        // Mock native plugin call
        // const { HealthKit } = await import('@capacitor-community/healthkit');
        // const steps = await HealthKit.queryRecord({ sampleType: 'stepCount' ... });
        
        // For demonstration, even on native without the actual plugin installed, return mock data
        return getMockWearableData();
    } catch (e) {
        console.error('Failed to fetch health data', e);
        return getMockWearableData();
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
