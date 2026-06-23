/**
 * Calculates a Readiness Score (0-100) based on sleep and workout volume.
 * 
 * @param {Object} data 
 * @param {number} data.sleepHours - Hours of sleep last night
 * @param {Array} data.workoutLogs - Historical workout logs
 * @returns {Object} { score: number, breakdown: object, recommendation: string }
 */
export const calculateReadiness = ({ sleepHours = 0, workoutLogs = [] }) => {
    // 1. Sleep Score (40% Weight)
    // 8h = 100, 7h = 80, 6h = 60, 5h = 40, <4h = 20
    let sleepScore = 0;
    if (sleepHours >= 8) sleepScore = 100;
    else if (sleepHours >= 7) sleepScore = 80;
    else if (sleepHours >= 6) sleepScore = 60;
    else if (sleepHours >= 5) sleepScore = 40;
    else if (sleepHours > 0) sleepScore = 20;
    else sleepScore = 75; // Default if no data

    // 2. Recovery Score (35% Weight)
    // Days since last workout
    let recoveryScore = 100;
    let daysSinceLast = null;
    let yesterdayVolume = 0;
    
    // Sort logs newest first
    const sortedLogs = [...workoutLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (sortedLogs.length > 0) {
        const lastWorkoutDate = new Date(sortedLogs[0].date);
        lastWorkoutDate.setHours(0,0,0,0);
        
        daysSinceLast = Math.floor((today - lastWorkoutDate) / (1000 * 60 * 60 * 24));

        if (daysSinceLast === 0) recoveryScore = 40; // Worked out today already (fatigued)
        else if (daysSinceLast === 1) recoveryScore = 70; // Worked out yesterday
        else if (daysSinceLast >= 2) recoveryScore = 100; // Fully rested
    }

    // 3. Volume Score (25% Weight)
    let volumeScore = 100;
    
    if (daysSinceLast === 1) {
        // Calculate yesterday's volume
        const yesterdayWorkout = sortedLogs[0];
        
        const calculateVolume = (exercises) => {
            let vol = 0;
            if (exercises && typeof exercises === 'object') {
                const exArray = Array.isArray(exercises) ? exercises : Object.values(exercises);
                exArray.forEach(sets => {
                    if (Array.isArray(sets)) {
                        sets.forEach(set => {
                            vol += (parseFloat(set.weight) || 0) * (parseFloat(set.reps) || 0);
                        });
                    }
                });
            }
            return vol;
        };
        
        yesterdayVolume = calculateVolume(yesterdayWorkout.exercises);
        
        // Calculate 7 day average volume
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentWorkouts = sortedLogs.filter(w => new Date(w.date) >= sevenDaysAgo && new Date(w.date) < yesterday);
        let totalRecentVolume = 0;
        recentWorkouts.forEach(w => {
            totalRecentVolume += calculateVolume(w.exercises);
        });
        
        const avgVolume = recentWorkouts.length > 0 ? totalRecentVolume / recentWorkouts.length : 0;
        
        if (avgVolume > 0 && yesterdayVolume > avgVolume * 1.2) {
            volumeScore = 40; // Overreaching yesterday
        } else {
            volumeScore = 80; // Normal load yesterday
        }
    }

    // Final Weighted Score
    const finalScore = Math.round((sleepScore * 0.40) + (recoveryScore * 0.35) + (volumeScore * 0.25));

    let status = '';
    let recommendation = '';

    if (finalScore >= 70) {
        status = 'Prime to Train';
        recommendation = 'You are fully recovered and ready for a high-intensity session.';
    } else if (finalScore >= 40) {
        status = 'Moderate';
        recommendation = 'You have some lingering fatigue. Keep volume moderate today.';
    } else {
        status = 'Recovery Mode';
        recommendation = 'Prioritize active recovery, stretching, or light cardio today.';
    }

    // If there is literally 0 data (new user, no health connect)
    if (sleepHours === 0 && workoutLogs.length === 0) {
        return {
            score: 75,
            status: 'Ready',
            recommendation: 'Start tracking workouts and sleep to get a personalized readiness score.',
            breakdown: { sleepScore: 75, recoveryScore: 75, volumeScore: 75 }
        };
    }

    return {
        score: finalScore,
        status,
        recommendation,
        breakdown: {
            sleepScore,
            recoveryScore,
            volumeScore
        }
    };
};
