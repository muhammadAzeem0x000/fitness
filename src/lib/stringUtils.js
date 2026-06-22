/**
 * Calculates a simple string similarity score.
 * Lower score is better (0 is exact match).
 */
export function stringSimilarity(str1, str2) {
    const s1 = str1.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const s2 = str2.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

    if (s1 === s2) return 0;
    if (s1.includes(s2) || s2.includes(s1)) return 1;

    const words1 = s1.split(' ');
    const words2 = s2.split(' ');

    let matches = 0;
    for (const w1 of words1) {
        if (words2.includes(w1)) matches++;
    }

    // Give a score based on matched words. We want a low score for good matches.
    // 5 minus the number of matched words, bounded at 0.
    return Math.max(0, 5 - matches);
}

/**
 * Finds the best matching exercise object from an array based on name.
 * @param {string} targetName - The generated name from AI
 * @param {Array} availableExercises - The list of DB exercises
 */
export function getBestExerciseMatch(targetName, availableExercises) {
    if (!availableExercises || availableExercises.length === 0) return null;

    let bestMatch = null;
    let bestScore = Infinity;

    for (const ex of availableExercises) {
        const score = stringSimilarity(targetName, ex.name);
        if (score < bestScore) {
            bestScore = score;
            bestMatch = ex;
        }
        // Exact match short-circuit
        if (score === 0) break;
    }

    return bestMatch;
}
