import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
});

export async function generateHealthReport(weightHistory, workoutLogs, previousReport, reportType = 'weekly', userProfile = {}) {
    if (!apiKey) {
        throw new Error("Missing OpenAI API Key");
    }

    const { displayName, workoutDays } = userProfile;

    // Filter Data based on Type
    let daysToLookBack = 7;
    let promoText = "";

    if (reportType === 'daily') daysToLookBack = 1;
    if (reportType === 'monthly') daysToLookBack = 30;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToLookBack);

    const relevantWeights = weightHistory.filter(w => new Date(w.date) >= cutoffDate);
    const relevantWorkouts = workoutLogs.filter(w => new Date(w.date) >= cutoffDate);

    // --- Data Aggregation ---
    let totalVolume = 0;
    const typeCount = {};
    const keyLifts = {}; // Stores max weight for key movements

    relevantWorkouts.forEach((workout, i) => {
        // 1. Frequency
        typeCount[workout.type] = (typeCount[workout.type] || 0) + 1;

        // Ensure exercises is an array (handle potential JSON string or missing data)
        let exercises = workout.exercises;

        if (typeof exercises === 'string') {
            try {
                exercises = JSON.parse(exercises);
            } catch (e) {
                exercises = [];
            }
        }
        if (exercises && typeof exercises === 'object' && !Array.isArray(exercises)) {
            // Convert Object-based logs (ActiveSessionView) to Array
            const entries = Object.entries(exercises);
            exercises = entries.map(([name, sets]) => ({ name, sets }));
        }
        if (!Array.isArray(exercises)) {
            exercises = [];
        }

        if (exercises.length > 0) {
            exercises.forEach(exercise => {
                // 2. Volume & Key Lifts
                const exerciseName = (exercise.name || '').toLowerCase();
                let exerciseBest = 0;

                if (Array.isArray(exercise.sets)) {
                    exercise.sets.forEach(set => {
                        const weight = parseFloat(set.weight) || 0;
                        const reps = parseFloat(set.reps) || 0;
                        totalVolume += weight * reps;

                        if (weight > exerciseBest) exerciseBest = weight;
                    });
                }

                // Check for Key Lifts (Simple keyword matching)
                const isKeyLift = ['bench press', 'squat', 'deadlift', 'overhead press', 'pull up'].some(k => exerciseName.includes(k));
                if (isKeyLift && exerciseBest > 0) {
                    if (!keyLifts[exercise.name] || exerciseBest > keyLifts[exercise.name]) {
                        keyLifts[exercise.name] = exerciseBest;
                    }
                }
            });
        }
    });

    // Format Aggregated Data
    const frequencyString = Object.entries(typeCount).map(([type, count]) => `${type}: ${count}`).join(', ') || "None";
    const keyLiftsString = Object.entries(keyLifts).map(([name, weight]) => `${name} (${weight}kg)`).join(', ') || "None detected";

    // ------------------------

    const dataString = `
    User Name: ${displayName || "Athlete"}
    Scheduled Workout Days: ${workoutDays && workoutDays.length > 0 ? workoutDays.join(', ') : "Flexible"}
    Duration: Last ${daysToLookBack} Days
    
    --- METRICS ---
    Workouts Completed: ${relevantWorkouts.length}
    Split Breakdown: ${frequencyString}
    Total Volume Load: ${Math.round(totalVolume).toLocaleString()} kg
    
    --- STRENGTH CHECK ---
    Top Lifts (Max Weight): ${keyLiftsString}
    
    --- BODY METRICS ---
    Weight Entries: ${relevantWeights.length}
    Latest Weight: ${relevantWeights.length > 0 ? relevantWeights[relevantWeights.length - 1].weight + 'kg' : 'No recent data'}
    `;

    let specificInstruction = "";
    if (reportType === 'daily') {
        specificInstruction = "Critique today's session (if any) and the most recent weight fluctuation. Be quick and punchy.";
    } else if (reportType === 'weekly') {
        specificInstruction = "Analyze volume trends and consistency over the last week. Give 3 actionable tips for next week.";
    } else {
        specificInstruction = "Analyze hypertrophy progress and weight trend over the month. Look for long-term consistency issues or wins.";
    }

    const systemPrompt = `You are an elite fitness coach addressing ${displayName || "the athlete"}. Analyze their data for a ${reportType} check-in.
  
  Data Summary:
  ${dataString}
  
  Previous Report Context: ${previousReport ? previousReport.report_text : "None"}
  
  Goal:
  ${specificInstruction}
  Be harsh but encouraging. Call them by name if provided. Keep it concise (under 200 words).
  
  format: Markdown. STRICTLY use **bold** for key metrics and *bullet points* for lists. Use ### for section headers.`;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: systemPrompt }],
            model: "gpt-3.5-turbo",
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("OpenAI API Detailed Error:", error);
        const message = error?.error?.message || error.message || "Unknown OpenAI Error";
        throw new Error(`OpenAI Failed: ${message}`);
    }
}
