// A curated dictionary mapping standard exercises to top-tier YouTube tutorial Video IDs
// Focuses on high-quality fitness educators like Renaissance Periodization, Jeff Nippard, Athlean-X, Squat University, etc.

export const EXERCISE_VIDEOS = {
    // Chest
    "Barbell Bench Press": "vcBig73ojpE", // Jeff Nippard
    "Incline Dumbbell Press": "8iPEnn-ltC8", // Renaissance Periodization
    "Dumbbell Flyes": "eozdVDA78K0", // Athlean-X
    "Dumbbell Pullover": "jQqR-nEq6-s",
    "Cable Crossovers": "taI4XduLpTk",
    "Push-Ups": "IODxDxX7oi4", // Calisthenic Movement
    "Machine Chest Press": "xUm0BiZCWlQ",
    "Pec Deck Fly": "O_XED9q8y0Y",
    "Dips (Chest Focus)": "yN6Q1UI_xkE",
    "Incline Barbell Press": "SrqOu55lrOU",
    "Smith Machine Bench Press": "F1x0iL4GvW0",
    
    // Back
    "Seated Cable Rows": "GZbfZ033f74", // Renaissance Periodization
    "Lat Pulldowns": "EUIri47Epcg", // Jeff Nippard
    "Single Arm Dumbbell Row": "pYcpY20QaE8", // Jeff Nippard
    "Deadlift": "wYREQkVtvEc", // Mark Rippetoe / Art of Manliness
    "Pull-Ups": "eGo4IYPNBG4", // Jeff Nippard
    "Barbell Rows": "9Gf-RraK7m8", // Renaissance Periodization
    "Chin-Ups": "mRy9m2Q9_1I",
    "Face Pulls": "V8dZ3pyiCBo", // Athlean-X (Classic)
    "Meadows Row": "Nq_95M-W8S8", // John Meadows
    "Straight Arm Lat Pull Down": "GjeMhGusA7A",
    "Rack Pulls": "HkH4x_p5Fms",

    // Shoulders
    "Overhead Press (OHP)": "_RlRDWO2jfg", // Mark Rippetoe
    "Seated Dumbbell Press": "qEwKCR5JCog", // Jeff Nippard
    "Lateral Raises": "WJm94H5J8vA", // Renaissance Periodization
    "Front Raises": "-t7fuZ0KhDA",
    "Arnold Press": "6Z15_WdXmVw",
    "Machine Reverse Flyes": "q-190jA39o4",
    "Shrugs": "cJRVVxmytaM",
    "Barbell Upright Rows": "amCU-ziHITM",
    "Push Press": "iaBVSJm78ko",
    "Lu Raises": "fVp4kS1gHxk",

    // Arms
    "Standing Barbell Curl": "kwG2ipFRgfo", // Jeff Nippard
    "Incline Dumbbell Curl": "aTYlqC_JacQ", // Renaissance Periodization
    "Standing Hammer Curl": "TwD-YGVP4Bk",
    "Straight Bar Tricep Pushdown": "2-LAMcpzODU", // Jeff Nippard
    "EZ Bar Preacher Curl": "vngli9UR6G0",
    "Rope Pushdown": "-Vyt2QdscBa",
    "Seated Dumbbell Tricep Extension": "nRiJVZDpdL0",
    "Kickbacks": "ZO81bExngMI",
    "Machine Bicep Curl": "vngli9UR6G0",
    "Close Grip Bench Press": "nEF0bv2FW94",

    // Legs
    "Barbell Squat": "bEv6CCg2BC8", // Jeff Nippard / Squat University
    "Romanian Deadlift": "XowKFitgKE", // Renaissance Periodization
    "Leg Press": "WjaGqL_Yf3o", // Renaissance Periodization
    "Bulgarian Split Squat": "2C-uNgKwPLE", // Jeff Nippard
    "Leg Extensions": "YyvSfVjQeL0",
    "Lying Leg Curls": "1Tq3QdYUuHs",
    "Lunges": "D7KaRcUTQeE",
    "Hack Squat": "0tn5K9NlCfo",
    "Calf Raises": "gwLzBJYoWlI", // Jeff Nippard
    "Front Squat": "v-Lq0s2I_Xw",
    "Hip Thrusts": "Zp26q4BY5CE", // Bret Contreras
    "Goblet Squat": "MeIiIdhgPxc",

    // Cardio/Core
    "Treadmill Run": "8iPEnn-ltC8", // Generic
    "Jump Rope": "1BZDkkQcZqg",
    "Burpees": "TU8QYVW0gDU",
    "Mountain Climbers": "nmwgirgXLYM",
    "Kettlebell Swings": "sSby1AQ-MJM",
};

/**
 * Gets the most appropriate YouTube embed URL for a given exercise.
 * If the exercise is curated, returns the exact premium video.
 * If not, falls back to a dynamic YouTube search embed for "how to do [exercise] exercise".
 */
export const getExerciseVideoUrl = (exerciseName) => {
    const videoId = EXERCISE_VIDEOS[exerciseName];
    
    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }

    // Dynamic fallback for custom user-created exercises
    const query = encodeURIComponent(`how to do ${exerciseName} exercise form guide`);
    return `https://www.youtube.com/embed?listType=search&list=${query}&autoplay=1`;
};
