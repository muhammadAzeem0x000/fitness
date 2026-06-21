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
