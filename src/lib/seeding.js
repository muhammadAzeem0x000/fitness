import { supabase } from './supabase';

export const DEFAULT_EXERCISES = {
    Chest: [
        "Barbell Bench Press", "Incline Dumbbell Press", "Dumbbell Flyes", "Dumbbell Pullover", "Cable Crossovers",
        "Push-Ups", "Machine Chest Press", "Incline Chest Press machine", "Incline Barbell Press", "Decline Bench Press",
        "Pec Deck Fly", "Dips (Chest Focus)", "Smith Machine Bench Press", "Landmine Press",
        "Svend Press", "Plate Press", "Floor Press"
    ],
    Back: [
        "Seated Cable Rows", "Incline T-Bar Rows", "Lat Pulldowns", "Behind Neck Lat Pull Down", "Iso Lateral Pull Down", "Seated Row Machine", "Face Pulls", "Single Arm Dumbbell Row", "Straight Arm Lat Pull Down", "Deadlift", "Pull-Ups", "Barbell Rows",
        "Chin-Ups", "Rack Pulls", "Meadows Row", "Renegade Row", "Back Extensions", "Good Mornings"
    ],
    Shoulders: [
        "Barbell Upright Rows", "Barbell Curl Upright Rows", "Lateral Raises", "Front Raises", "Machine Reverse Flyes", "Machine Shoulders Press", "Shrugs", "Overhead Press (OHP)", "Seated Dumbbell Press",
        "Arnold Press", "Cable Lateral Raises",
        "Push Press", "Behind The Neck Press", "Egyptian Lateral Raises", "Lu Raises", "Military Press"
    ],
    Arms: [
        "Standing Barbell Curl", "Incline Dumbbell Curl", "Standing Hammer Curl", "Straight Bar Tricep Pushdown", "EZ Bar Preacher Curl", "Rope Pushdown", "Seated Dumbbell Tricep Extension", "Single Arm Dumbell Overhead Extension",
        "Close Grip Barbell", "Close Grip Bench Press", "Straight Bar Cable Curl", "Machine Bicep Curl", "Spider Curls", "Kickbacks", "Waiters Curl", "Reverse Grip Pushdown"
    ],
    Legs: [
        "Barbell Squat", "Leg Press", "Romanian Deadlift", "Leg Extensions", "Lying Leg Curls",
        "Bulgarian Split Squat", "Lunges", "Hack Squat", "Calf Raises", "Front Squat",
        "Seated Leg Curls", "Hip Thrusts", "Goblet Squat", "Sumo Deadlift", "Step Ups"
    ],
    Core: [
        "Crunches", "Sit-Ups", "Plank", "Russian Twists", "Leg Raises",
        "Hanging Knee Raises", "Cable Crunches", "Ab Wheel Rollout", "Side Plank",
        "Decline Sit-Ups", "Bicycle Crunches", "Dead Bug", "Flutter Kicks"
    ],
    Cardio: [
        "Treadmill Run", "Cycling", "Elliptical", "Rowing Machine", "Stair Climber",
        "Jump Rope", "HIIT", "Swimming", "Walking", "Sprinting",
        "Battle Ropes", "Burpees", "Box Jumps", "Mountain Climbers", "Kettlebell Swings"
    ]
};

export const seedExercises = async () => {
    console.log("Starting seed...");

    // Check if exercises exist
    const { count, error: countError } = await supabase
        .from('exercises')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error("Error checking exercises table:", countError);
        return { success: false, error: countError };
    }

    /* Force update enabled
    if (count > 0) {
        console.log("Exercises table already populated.");
        return { success: true, message: "Already populated" };
    }
    */
    console.log("Exercises table exists. Running Upsert to ensure defaults are up to date.");

    const payload = [];
    Object.entries(DEFAULT_EXERCISES).forEach(([category, exercises]) => {
        exercises.forEach(name => {
            payload.push({ name, category, created_at: new Date() });
        });
    });

    // Use upsert to update existing or insert new. Assumes 'name' is unique/PK.
    const { error: insertError } = await supabase
        .from('exercises')
        .upsert(payload, { onConflict: 'name' });

    if (insertError) {
        console.error("Error inserting exercises:", insertError);
        return { success: false, error: insertError };
    }

    console.log("Successfully seeded exercises.");
    return { success: true, message: "Seeded successfully" };
};
