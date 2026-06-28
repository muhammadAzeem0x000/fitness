/**
 * Nutrition Utilities
 * Handles TDEE (Total Daily Energy Expenditure) and Macro Target calculations.
 */

// Mifflin-St Jeor Equation for BMR
export function calculateBMR(weightKg, heightCm, age, gender) {
    if (!weightKg || !heightCm || !age || !gender) return 0;
    
    // BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + s
    // s = +5 for males, -161 for females
    const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    return gender === 'male' ? base + 5 : base - 161;
}

// Activity Multipliers
const ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,          // Little to no exercise
    lightly_active: 1.375,   // Light exercise/sports 1-3 days/week
    moderately_active: 1.55, // Moderate exercise/sports 3-5 days/week
    very_active: 1.725,      // Hard exercise/sports 6-7 days a week
    super_active: 1.9        // Very hard exercise/physical job
};

export function calculateTDEE(bmr, activityLevel) {
    if (!bmr || !activityLevel) return 0;
    const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
    return Math.round(bmr * multiplier);
}

/**
 * Calculates target macros based on TDEE, weight, and goal.
 * Goal: 'cut' (-500 cal), 'maintain' (0 cal), 'bulk' (+500 cal)
 */
export function calculateTargetMacros(tdee, weightKg, goalType) {
    if (!tdee || !weightKg) return { calories: 0, protein: 0, carbs: 0, fats: 0 };

    let targetCalories = tdee;
    if (goalType === 'cut') targetCalories -= 500;
    if (goalType === 'bulk') targetCalories += 500;

    // Minimum safe calories
    if (targetCalories < 1200) targetCalories = 1200;

    // Standard Macro Split for Fitness:
    // Protein: ~2g per kg of bodyweight
    // Fats: ~0.8g per kg of bodyweight
    // Carbs: Remainder of calories
    const protein = Math.round(weightKg * 2);
    const fats = Math.round(weightKg * 0.8);
    
    // 1g Protein = 4 cal, 1g Fat = 9 cal, 1g Carb = 4 cal
    const proteinCals = protein * 4;
    const fatCals = fats * 9;
    
    const remainingCals = targetCalories - (proteinCals + fatCals);
    const carbs = Math.round(Math.max(0, remainingCals / 4));

    return {
        calories: targetCalories,
        protein,
        fats,
        carbs
    };
}

/**
 * Calculates an adaptive TDEE based on 14-day weight trends and average calorie intake.
 * If there isn't enough data, it falls back to the formula-based TDEE.
 */
export function calculateAdaptiveTDEE(weightLogs = [], nutritionLogs = [], currentTDEE) {
    if (weightLogs.length < 3 || nutritionLogs.length < 5) return currentTDEE;

    // Filter to last 14 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    
    const recentWeights = weightLogs.filter(w => new Date(w.date) >= cutoff).sort((a, b) => new Date(a.date) - new Date(b.date));
    const recentNutrition = nutritionLogs.filter(n => new Date(n.date) >= cutoff);
    
    if (recentWeights.length < 2 || recentNutrition.length < 5) return currentTDEE;

    // Average daily intake
    const totalCals = recentNutrition.reduce((sum, log) => sum + (log.calories || 0), 0);
    // Unique days tracked
    const uniqueDays = new Set(recentNutrition.map(n => n.date)).size;
    if (uniqueDays === 0) return currentTDEE;
    
    const avgIntake = totalCals / uniqueDays;

    // Weight trend (first vs last in the 14 day period)
    const firstWeight = recentWeights[0].weight;
    const lastWeight = recentWeights[recentWeights.length - 1].weight;
    const weightChangeKg = lastWeight - firstWeight;

    // 1 kg of body tissue is roughly 7700 calories
    const totalCaloricDeficitOrSurplus = weightChangeKg * 7700;
    
    // Average daily deficit/surplus over 14 days
    const dailyBalance = totalCaloricDeficitOrSurplus / 14;

    // TDEE = intake - balance
    let adaptiveTDEE = Math.round(avgIntake - dailyBalance);
    
    // Sanity check: cap it to within 30% of the formula TDEE
    const maxDiff = currentTDEE * 0.3;
    if (adaptiveTDEE > currentTDEE + maxDiff) adaptiveTDEE = currentTDEE + maxDiff;
    if (adaptiveTDEE < currentTDEE - maxDiff) adaptiveTDEE = currentTDEE - maxDiff;

    return Math.round(adaptiveTDEE);
}

/**
 * Adjusts calorie and macro targets based on whether the given date is a training day.
 */
export function getAdjustedTargets(baseTargets, workoutDays = [], dateString) {
    if (!baseTargets) return null;
    
    // Get day name (e.g., 'monday', 'tuesday')
    const dateObj = dateString ? new Date(dateString) : new Date();
    // Adjust for timezone issues if dateString is YYYY-MM-DD
    const localDate = dateString ? new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000) : dateObj;
    
    const dayName = localDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const isTrainingDay = workoutDays.map(d => d.toLowerCase()).includes(dayName);
    
    if (!isTrainingDay) return { ...baseTargets, isTrainingDay: false };

    // On training days, bump calories by 250, mostly from carbs and a little protein
    const adjusted = { ...baseTargets };
    adjusted.calories += 250;
    adjusted.carbs += 45; // 45g carbs = 180 cal
    adjusted.protein += 17; // 17g protein = 68 cal
    
    adjusted.isTrainingDay = true;
    return adjusted;
}
