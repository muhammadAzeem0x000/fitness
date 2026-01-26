import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Enabling for client-side prototype; move to backend in production
});

export async function generateHealthReport(weightHistory, workoutLogs, previousReport) {
    if (!apiKey) {
        throw new Error("Missing OpenAI API Key");
    }

    // Format Data for Prompt
    const recentWeight = weightHistory.slice(-30).map(e => `${e.date}: ${e.weight}kg`).join('\n');
    const recentWorkouts = workoutLogs.slice(-5).map(e => `${e.date}: ${e.type}`).join('\n');

    const systemPrompt = `You are an elite fitness coach. Analyze the user's data. 
  
  Data Provided:
  - Last 30 Weight Entries:
  ${recentWeight}
  
  - Last 5 Workouts:
  ${recentWorkouts}
  
  - Previous Report Context: ${previousReport ? previousReport.report_text : "None"}
  
  Goal:
  1. Analyze weight trend (Loss/Gain/Stall).
  2. Critique workout consistency.
  3. Give 3 specific actionable tips for the next week.
  4. Be harsh but encouraging.
  
  Format: Markdown. Keep it concise.`;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: systemPrompt }],
            model: "gpt-3.5-turbo",
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("OpenAI API Detailed Error:", error);
        // Extract meaningful message from error object if possible
        const message = error?.error?.message || error.message || "Unknown OpenAI Error";
        throw new Error(`OpenAI Failed: ${message}`);
    }
}
