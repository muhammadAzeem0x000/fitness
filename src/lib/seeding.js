import { supabase } from './supabase';

export const DEFAULT_EXERCISES = {
    Chest: [
        "Barbell Bench Press", "Incline Dumbbell Press", "Dumbbell Flyes", "Dumbbell Pullover", "Cable Crossovers",
        "Push-Ups", "Machine Chest Press", "Incline Chest Press machine", "Incline Barbell Press", "Decline Bench Press",
        "Pec Deck Fly", "Dips (Chest Focus)", "Smith Machine Bench Press", "Landmine Press",
        "Svend Press", "Plate Press", "Floor Press"
    ],
    Back: [
        "Deadlift", "Pull-Ups", "Barbell Rows", "Lat Pulldowns", "Seated Cable Rows",
        "Face Pulls", "T-Bar Rows", "Single Arm Dumbbell Row", "Chin-Ups", "Straight Arm Pulldowns",
        "Rack Pulls", "Meadows Row", "Renegade Row", "Back Extensions", "Good Mornings"
    ],
    Shoulders: [
        "Overhead Press (OHP)", "Seated Dumbbell Press", "Lateral Raises", "Front Raises", "Reverse Flyes",
        "Arnold Press", "Upright Rows", "Face Pulls", "Cable Lateral Raises", "Shrugs",
        "Push Press", "Behind The Neck Press", "Egyptian Lateral Raises", "Lu Raises", "Military Press"
    ],
    Arms: [
        "Barbell Curl", "Dumbbell Curl", "Hammer Curl", "Preacher Curl", "Concentration Curl",
        "Tricep Pushdowns", "Skullcrushers", "Overhead Tricep Extension", "Close Grip Bench Press", "Dips",
        "Cable Curls", "Spider Curls", "Kickbacks", "Waiters Curl", "Reverse Grip Pushdown"
    ],
    Legs: [
        "Barbell Squat", "Leg Press", "Romanian Deadlift", "Leg Extensions", "Lying Leg Curls",
        "Bulgarian Split Squat", "Lunges", "Hack Squat", "Calf Raises", "Front Squat",
        "Seated Leg Curls", "Hip Thrusts", "Goblet Squat", "Sumo Deadlift", "Step Ups"
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

    if (count > 0) {
        console.log("Exercises table already populated.");
        return { success: true, message: "Already populated" };
    }

    const payload = [];
    Object.entries(DEFAULT_EXERCISES).forEach(([category, exercises]) => {
        exercises.forEach(name => {
            payload.push({ name, category, created_at: new Date() });
        });
    });

    const { error: insertError } = await supabase
        .from('exercises')
        .insert(payload);

    if (insertError) {
        console.error("Error inserting exercises:", insertError);
        return { success: false, error: insertError };
    }

    console.log("Successfully seeded exercises.");
    return { success: true, message: "Seeded successfully" };
};
