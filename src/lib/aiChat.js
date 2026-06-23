import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;

const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.deepseek.com/v1',
    dangerouslyAllowBrowser: true
});

/**
 * Send a chat message to the AI coach and get a streamed response
 * @param {Array} messages - Chat history [{role: 'user'|'assistant', content: '...'}]
 * @param {Object} userContext - User's fitness context
 * @param {Function} onChunk - Callback for each streamed text chunk
 * @returns {Promise<string>} Full response text
 */
export async function sendChatMessage(messages, userContext = {}, onChunk = null) {
    if (!apiKey) {
        throw new Error("Missing DeepSeek API Key");
    }

    const {
        displayName,
        currentWeight,
        height,
        targetWeight,
        workoutDays,
        workoutHistory,
        routineList,
        nutritionHistory,
        totalWorkouts,
        currentStreak
    } = userContext;

    const systemPrompt = `You are an elite AI fitness coach embedded in the SmartFit app. You have access to the user's comprehensive fitness data and help them with workout advice, nutrition tips, motivation, form corrections, and training programming.

USER PROFILE:
- Name: ${displayName || "Athlete"}
- Current Weight: ${currentWeight ? currentWeight + 'kg' : 'Unknown'}
- Height: ${height ? height + 'cm' : 'Unknown'}
- Target Weight: ${targetWeight ? targetWeight + 'kg' : 'Not set'}
- Workout Days: ${workoutDays?.join(', ') || 'Flexible'}
- Total Workouts Logged: ${totalWorkouts || 0}
- Current Streak: ${currentStreak || 0} days

ROUTINES:
${routineList || 'No saved routines.'}

WORKOUT HISTORY:
${workoutHistory || 'No workout data available.'}

NUTRITION HISTORY:
${nutritionHistory || 'No nutrition data available.'}

PERSONALITY & RULES:
1. Be direct, knowledgeable, and motivating. Like a tough but caring coach.
2. Reference the user's actual data when relevant — don't make up stats.
3. Keep responses concise (under 150 words unless the user asks for detail).
4. Use markdown formatting: **bold** for emphasis, bullet points for lists.
5. If asked about injuries or medical conditions, always recommend consulting a doctor first.
6. Call the user by name when appropriate.
7. Be practical — give actionable advice, not generic platitudes.`;

    const apiMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    try {
        if (onChunk) {
            // Streaming mode
            const stream = await openai.chat.completions.create({
                messages: apiMessages,
                model: "deepseek-v4-flash",
                temperature: 0.7,
                max_tokens: 512,
                stream: true,
            });

            let fullResponse = '';
            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta?.content || '';
                if (delta) {
                    fullResponse += delta;
                    onChunk(fullResponse);
                }
            }
            return fullResponse;
        } else {
            // Non-streaming mode
            const completion = await openai.chat.completions.create({
                messages: apiMessages,
                model: "deepseek-v4-flash",
                temperature: 0.7,
                max_tokens: 512,
            });
            return completion.choices[0].message.content;
        }
    } catch (error) {
        console.error("Chat Error:", error);
        const message = error?.error?.message || error.message || "Unknown Error";
        throw new Error(`Chat failed: ${message}`);
    }
}
