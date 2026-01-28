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

    const dataString = `
    User Name: ${displayName || "Athlete"}
    Scheduled Workout Days: ${workoutDays && workoutDays.length > 0 ? workoutDays.join(', ') : "Flexible"}
    Duration: Last ${daysToLookBack} Days
    Weight Entries: ${relevantWeights.length}
    Workouts Logged: ${relevantWorkouts.length}
    Latest Weight: ${relevantWeights.length > 0 ? relevantWeights[relevantWeights.length - 1].weight + 'kg' : 'No recent data'}
    Latest Workout: ${relevantWorkouts.length > 0 ? relevantWorkouts[0].type : 'None'}
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
  
  format: Markdown.`;

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
