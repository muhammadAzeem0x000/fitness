/**
 * A curated dictionary mapping standard exercises to exact, short-form (30-60s)
 * YouTube video IDs from channels like Muscle & Strength that explicitly allow embedding.
 * Long tutorials and channels that block embeds (like Jeff Nippard) are excluded.
 */
export const EXERCISE_VIDEOS = {
    // Chest
    "Barbell Bench Press": "rT7DgCr-3pg", // Muscle & Strength
    "Incline Dumbbell Press": "8iPEnn-ltC8", 
    "Dumbbell Flyes": "eozdVDA78K0", 
    "Push-Ups": "IODxDxX7oi4", 
    
    // Back
    "Lat Pulldowns": "CAwf7n6Luuc", // Muscle & Strength
    "Deadlift": "ytGaGIn3SjE", // Muscle & Strength
    "Pull-Ups": "eGo4IYPNBG4",
    "Seated Cable Rows": "GZbfZ033f74", 
    
    // Shoulders
    "Overhead Press (OHP)": "QAQ64hK4Xxs", // Muscle & Strength
    "Lateral Raises": "WJm94H5J8vA",
    "Seated Dumbbell Press": "qEwKCR5JCog",
    
    // Arms
    "Standing Barbell Curl": "kwG2ipFRgfo",
    "Machine Bicep Curl": "vngli9UR6G0",
    "Straight Bar Tricep Pushdown": "2-LAMcpzODU",
    
    // Legs
    "Barbell Squat": "1oed-UmAxFs", // Muscle & Strength
    "Leg Press": "IZxyjW7OSvc", // Muscle & Strength
    "Romanian Deadlift": "XowKFitgKE",
    "Bulgarian Split Squat": "2C-uNgKwPLE",
};

/**
 * Gets the exact YouTube embed URL for a given exercise.
 * Returns null if the exercise does not have a verified embeddable ID.
 */
export const getExerciseVideoUrl = (exerciseName) => {
    const videoId = EXERCISE_VIDEOS[exerciseName];
    
    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }

    return null;
};
