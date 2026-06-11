import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_GROQ_API_KEY;

const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
    dangerouslyAllowBrowser: true
});

export async function generateHealthReport(weightHistory, workoutLogs, previousReport, reportType = 'weekly', userProfile = {}) {
    if (!apiKey) {
        throw new Error("Missing Groq API Key");
    }

    const { displayName, workoutDays } = userProfile;

    // Filter Data based on Type
    let daysToLookBack = 7;
    let promoText = "";

    if (reportType === 'daily') daysToLookBack = 3; // Extended from 1 to 3 days to catch recent entries
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

    // Check if this is a fresh account (no workout data)
    const isFreshAccount = relevantWorkouts.length === 0;

    // Build data string based on available data
    let dataString = `
    User Name: ${displayName || "Athlete"}
    Scheduled Workout Days: ${workoutDays && workoutDays.length > 0 ? workoutDays.join(', ') : "Flexible"}
    Duration: Last ${daysToLookBack} Days
    `;

    if (isFreshAccount) {
        // For fresh accounts, use only onboarding/profile data
        const currentWeight = relevantWeights.length > 0 ? relevantWeights[relevantWeights.length - 1].weight : userProfile.currentWeight || 0;
        const height = userProfile.height || 0;
        const targetWeight = userProfile.targetWeight || 0;
        const bmi = height > 0 ? ((currentWeight / ((height / 100) ** 2))).toFixed(1) : 0;

        dataString += `
    --- PROFILE DATA (Fresh Account - No Workout History Yet) ---
    Current Weight: ${currentWeight > 0 ? currentWeight + 'kg' : 'Not provided'}
    Height: ${height > 0 ? height + 'cm' : 'Not provided'}
    BMI: ${bmi > 0 ? bmi : 'Not calculable'}
    Target Weight: ${targetWeight > 0 ? targetWeight + 'kg' : 'Not set yet'}
    
    NOTE: User has not logged any workouts yet. Provide starter recommendations based on their profile.
        `;
    } else {
        // For existing users with workout data
        // Always show most recent weight even if outside the filter window
        const mostRecentWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1] : null;
        const weightChange = relevantWeights.length >= 2
            ? (relevantWeights[relevantWeights.length - 1].weight - relevantWeights[0].weight).toFixed(1)
            : 0;

        dataString += `
    --- METRICS ---
    Workouts Completed: ${relevantWorkouts.length}
    Split Breakdown: ${frequencyString}
    Total Volume Load: ${Math.round(totalVolume).toLocaleString()} kg
    
    --- STRENGTH CHECK ---
    Top Lifts (Max Weight): ${keyLiftsString}
    
    --- BODY METRICS ---
    Weight Entries (in ${daysToLookBack} days): ${relevantWeights.length}
    Latest Weight: ${mostRecentWeight ? `${mostRecentWeight.weight}kg (recorded ${new Date(mostRecentWeight.date).toLocaleDateString()})` : 'No data'}
    Weight Change (period): ${weightChange > 0 ? '+' : ''}${weightChange}kg
        `;
    }

    let specificInstruction = "";
    if (isFreshAccount) {
        specificInstruction = `This user has not logged any workouts yet. Based on their profile data (height, weight, BMI, target weight), provide:
        1. Encouragement to start their fitness journey
        2. Beginner-friendly workout plan recommendations based on their goals
        3. Tips for getting started with the SmartFit app
        Keep it motivating and actionable. Don't mention lack of data negatively - focus on the exciting journey ahead.`;
    } else if (reportType === 'daily') {
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
            model: "llama-3.3-70b-versatile",
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("Groq API Detailed Error:", error);
        const message = error?.error?.message || error.message || "Unknown Groq Error";
        throw new Error(`Groq Failed: ${message}`);
    }
}
