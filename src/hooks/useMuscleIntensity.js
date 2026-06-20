import { useMemo } from 'react';
import { EXERCISE_MUSCLE_MAP, ALL_MUSCLE_GROUPS, guessMuscleGroupFromType } from '../data/muscleMapping';

/**
 * Computes per-muscle-group training intensity from workout logs.
 * Returns an object keyed by muscle group with sets, volume, lastTrained, level, and daysSince.
 *
 * @param {Array} workouts - Workout logs from useWorkouts()
 * @param {number} days - Number of days to look back (default 7)
 * @returns {Object} muscleData - { [muscleGroup]: { sets, volume, lastTrained, level, daysSince, label } }
 */
export function useMuscleIntensity(workouts = [], days = 7) {
    return useMemo(() => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        const recentWorkouts = workouts.filter(w => new Date(w.date) >= cutoff);

        // Initialize all muscle groups
        const muscles = {};
        ALL_MUSCLE_GROUPS.forEach(group => {
            muscles[group] = { sets: 0, volume: 0, lastTrained: null };
        });

        recentWorkouts.forEach(workout => {
            const workoutDate = new Date(workout.date);
            let exercises = workout.exercises;

            // Handle different data formats (string JSON, object, array)
            if (typeof exercises === 'string') {
                try { exercises = JSON.parse(exercises); } catch { exercises = {}; }
            }
            if (!exercises || typeof exercises !== 'object') return;

            // Convert to consistent [name, setsArray] format
            let exerciseEntries = [];
            if (Array.isArray(exercises)) {
                exerciseEntries = exercises.map(e => [e.name || '', e.sets || []]);
            } else {
                exerciseEntries = Object.entries(exercises);
            }

            let matchedAny = false;

            exerciseEntries.forEach(([name, sets]) => {
                const setsArray = Array.isArray(sets) ? sets : [];
                const setCount = setsArray.length;
                if (setCount === 0) return;

                const volume = setsArray.reduce((sum, s) => {
                    return sum + ((parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0));
                }, 0);

                // Look up muscle mapping
                const mapping = EXERCISE_MUSCLE_MAP[name];
                if (mapping) {
                    matchedAny = true;
                    // Primary muscles get full credit
                    mapping.primary.forEach(muscle => {
                        if (muscles[muscle]) {
                            muscles[muscle].sets += setCount;
                            muscles[muscle].volume += volume;
                            if (!muscles[muscle].lastTrained || workoutDate > muscles[muscle].lastTrained) {
                                muscles[muscle].lastTrained = workoutDate;
                            }
                        }
                    });
                    // Secondary muscles get 40% credit
                    mapping.secondary.forEach(muscle => {
                        if (muscles[muscle]) {
                            muscles[muscle].sets += Math.round(setCount * 0.4);
                            muscles[muscle].volume += Math.round(volume * 0.4);
                            if (!muscles[muscle].lastTrained || workoutDate > muscles[muscle].lastTrained) {
                                muscles[muscle].lastTrained = workoutDate;
                            }
                        }
                    });
                }
            });

            // Fallback: if no exercises matched our map, guess from workout type
            if (!matchedAny && workout.type) {
                const guessedGroups = guessMuscleGroupFromType(workout.type);
                const totalSets = exerciseEntries.reduce((sum, [, sets]) =>
                    sum + (Array.isArray(sets) ? sets.length : 0), 0);
                const totalVolume = exerciseEntries.reduce((sum, [, sets]) => {
                    if (!Array.isArray(sets)) return sum;
                    return sum + sets.reduce((s, set) =>
                        s + ((parseFloat(set.weight) || 0) * (parseFloat(set.reps) || 0)), 0);
                }, 0);

                const setsPerGroup = Math.round(totalSets / Math.max(guessedGroups.length, 1));
                const volPerGroup = Math.round(totalVolume / Math.max(guessedGroups.length, 1));

                guessedGroups.forEach(muscle => {
                    if (muscles[muscle]) {
                        muscles[muscle].sets += setsPerGroup;
                        muscles[muscle].volume += volPerGroup;
                        if (!muscles[muscle].lastTrained || workoutDate > muscles[muscle].lastTrained) {
                            muscles[muscle].lastTrained = workoutDate;
                        }
                    }
                });
            }
        });

        // Calculate intensity level and days since last trained
        const now = new Date();
        Object.keys(muscles).forEach(key => {
            const m = muscles[key];

            // Intensity levels matching the heatmap legend
            if (m.sets === 0)       m.level = 0;   // Rested
            else if (m.sets <= 4)   m.level = 1;   // Active
            else if (m.sets <= 9)   m.level = 2;   // Productive
            else                    m.level = 3;   // Fatigued

            // Days since last trained
            if (m.lastTrained) {
                m.daysSince = Math.floor((now - m.lastTrained) / (1000 * 60 * 60 * 24));
            } else {
                m.daysSince = null;
            }
        });

        return muscles;
    }, [workouts, days]);
}
