import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;

const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.deepseek.com/v1',
    dangerouslyAllowBrowser: true
});

export async function generateHealthReport(weightHistory, workoutLogs, previousReport, reportType = 'weekly', userProfile = {}) {
    if (!apiKey) {
        throw new Error("Missing DeepSeek API Key");
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
            model: "deepseek-v4-pro",
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("DeepSeek API Detailed Error:", error);
        const message = error?.error?.message || error.message || "Unknown DeepSeek Error";
        throw new Error(`DeepSeek Failed: ${message}`);
    }
}

/**
 * Generate a personalized workout plan using AI
 * @param {Object} options - Generation options
 * @param {string} options.goal - User's goal (strength, hypertrophy, endurance, fat_loss)
 * @param {string} options.targetMuscles - Target muscle group(s)
 * @param {string} options.duration - Available time (30, 45, 60, 90 minutes)
 * @param {string} options.equipment - Available equipment
 * @param {string} options.freeText - Free-text description from user
 * @param {Object} options.userProfile - User profile data
 * @param {Array} options.workoutHistory - Recent workout logs
 * @param {Array} options.availableExercises - Exercises available in the app database
 * @returns {Promise<Object>} Structured workout plan
 */
export async function generateWorkoutPlan({
    goal = '',
    targetMuscles = '',
    duration = '60',
    equipment = 'full_gym',
    freeText = '',
    userProfile = {},
    workoutHistory = [],
    availableExercises = []
}) {
    if (!apiKey) {
        throw new Error("Missing DeepSeek API Key");
    }

    const { displayName, currentWeight, height, targetWeight } = userProfile;

    // Build recent workout context (last 7 days)
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const recentWorkouts = workoutHistory.filter(w => new Date(w.date) >= cutoff);
    
    let recentWorkoutSummary = "No recent workouts.";
    if (recentWorkouts.length > 0) {
        recentWorkoutSummary = recentWorkouts.map(w => {
            let exerciseNames = [];
            const exData = w.exercises;
            if (exData && typeof exData === 'object' && !Array.isArray(exData)) {
                exerciseNames = Object.keys(exData);
            } else if (Array.isArray(exData)) {
                exerciseNames = exData.map(e => e.name || e);
            }
            return `- ${w.type || 'Workout'} (${new Date(w.date).toLocaleDateString()}): ${exerciseNames.slice(0, 5).join(', ')}`;
        }).join('\n');
    }

    // Build available exercises list for the AI to reference
    const exercisesByCategory = {};
    availableExercises.forEach(ex => {
        const cat = ex.category || 'Other';
        if (!exercisesByCategory[cat]) exercisesByCategory[cat] = [];
        exercisesByCategory[cat].push(ex.name);
    });
    const exerciseListString = Object.entries(exercisesByCategory)
        .map(([cat, names]) => `${cat}: ${names.join(', ')}`)
        .join('\n');

    // Build user request
    let userRequest = '';
    if (freeText) {
        userRequest = freeText;
    } else {
        const parts = [];
        if (goal) parts.push(`Goal: ${goal}`);
        if (targetMuscles) parts.push(`Target: ${targetMuscles}`);
        if (duration) parts.push(`Time available: ${duration} minutes`);
        if (equipment) parts.push(`Equipment: ${equipment.replace('_', ' ')}`);
        userRequest = parts.join('. ');
    }

    const systemPrompt = `You are an elite fitness coach. Generate a personalized workout plan.

USER PROFILE:
- Name: ${displayName || "Athlete"}
- Current Weight: ${currentWeight ? currentWeight + 'kg' : 'Unknown'}
- Height: ${height ? height + 'cm' : 'Unknown'}
- Target Weight: ${targetWeight ? targetWeight + 'kg' : 'Not set'}

RECENT WORKOUTS (last 7 days):
${recentWorkoutSummary}

AVAILABLE EXERCISES IN APP:
${exerciseListString}

RULES:
1. ONLY use exercise names from the AVAILABLE EXERCISES list above. Match names EXACTLY.
2. Generate 4-8 exercises depending on the time available.
3. Consider what the user trained recently to avoid overtraining the same muscles.
4. Tailor sets, reps, and rest to the user's stated goal.
5. You MUST respond with ONLY valid JSON, no markdown, no code fences, no explanation text.

RESPONSE FORMAT (strict JSON):
{
  "planName": "Short descriptive name for the workout",
  "exercises": [
    {
      "name": "Exact exercise name from the list",
      "sets": 3,
      "reps": 10,
      "restSeconds": 90,
      "notes": "Brief coaching cue"
    }
  ],
  "summary": "1-2 sentence description of the workout",
  "estimatedDuration": "45 min",
  "coachTip": "One motivational or strategic tip for this session"
}`;

    let rawContent = "";
    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userRequest }
            ],
            model: "deepseek-v4-pro",
            temperature: 0.7,
            max_tokens: 1024,
            response_format: { type: "json_object" }
        });

        rawContent = completion.choices[0].message.content || "";

        // Remove <think> blocks if DeepSeek added reasoning
        let cleanedContent = rawContent.replace(/<think>[\s\S]*?<\/think>\n?/g, '').trim();
        
        // Extract the JSON object using regex to ignore any conversational text before or after
        const match = cleanedContent.match(/\{[\s\S]*\}/);
        let jsonString = match ? match[0] : "{}";

        const plan = JSON.parse(jsonString);
        
        // Validate structure
        if (!plan.exercises || !Array.isArray(plan.exercises) || plan.exercises.length === 0) {
            throw new Error(`AI generated an empty workout plan. Raw Content: ${rawContent.substring(0, 200)}`);
        }

        return plan;
    } catch (error) {
        console.error("Workout Plan Generation Error:", error);
        
        // If JSON parse failed, give a more helpful error
        if (error instanceof SyntaxError) {
            console.error("RAW CONTENT FAILED PARSE:", rawContent);
            throw new Error(`AI returned an invalid format. Raw: ${rawContent.substring(0, 60)}...`);
        }
        
        const message = error?.error?.message || error.message || "Unknown Error";
        throw new Error(`Failed to generate workout plan: ${message}`);
    }
}

// --- NEW: Phase 2 Nutrition AI Functions ---

/**
 * Parses natural language food descriptions into estimated calories and macros.
 * Uses Groq to return a strict JSON object.
 */
export async function analyzeFoodInput(text) {
    if (!apiKey) throw new Error("Missing DeepSeek API Key");

    const prompt = `
    You are a professional sports nutritionist and calorie estimator API.
    The user will provide a text describing what they ate.
    You must estimate the calories, protein (g), carbs (g), and fats (g) for the entire meal described.
    
    CRITICAL INSTRUCTION: Return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
    Format required:
    {
      "calories": number,
      "protein": number,
      "carbs": number,
      "fats": number,
      "food_name": "A short 2-4 word summary of the meal"
    }
    
    User Input: "${text}"
    `;

    try {
        const response = await openai.chat.completions.create({
            model: "deepseek-v4-flash", // Fast model for simple parsing
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const rawContent = response.choices[0]?.message?.content || "{}";
        const match = rawContent.match(/\{[\s\S]*\}/);
        const jsonContent = match ? match[0] : "{}";
        const parsed = JSON.parse(jsonContent);
        // Enforce 4/4/9 strict mathematical accuracy
        parsed.calories = Math.round((parsed.protein * 4) + (parsed.carbs * 4) + (parsed.fats * 9));
        return parsed;
    } catch (error) {
        console.error("Error parsing food input:", error);
        throw error;
    }
}

/**
 * Generates a full 1-day meal plan based on target macros.
 */
export async function generateMealPlan(targetMacros, preferences = "") {
    if (!apiKey) throw new Error("Missing DeepSeek API Key");

    const prompt = `
    You are a professional sports nutritionist. Generate a 1-day meal plan that hits these exact daily targets:
    Calories: ${targetMacros.calories} kcal
    Protein: ${targetMacros.protein}g
    Carbs: ${targetMacros.carbs}g
    Fats: ${targetMacros.fats}g

    Additional User Preferences/Allergies: ${preferences || "None"}

    CRITICAL INSTRUCTION: Return ONLY a valid JSON object representing the meal plan. Do not include markdown formatting.
    Format required:
    {
      "meals": [
        {
          "type": "Breakfast",
          "name": "Meal name",
          "description": "Short description of ingredients",
          "calories": number,
          "protein": number,
          "carbs": number,
          "fats": number
        },
        // repeat for Lunch, Dinner, Snack
      ],
      "total_calories": number,
      "total_protein": number,
      "total_carbs": number,
      "total_fats": number
    }
    `;

    try {
        const response = await openai.chat.completions.create({
            model: "deepseek-v4-pro", // Use the smarter model for meal planning
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
            response_format: { type: "json_object" }
        });

        const rawContent = response.choices[0]?.message?.content || "{}";
        const match = rawContent.match(/\{[\s\S]*\}/);
        const jsonContent = match ? match[0] : "{}";
        const parsed = JSON.parse(jsonContent);
        
        // Enforce 4/4/9 strict mathematical accuracy on all meals
        if (parsed.meals && Array.isArray(parsed.meals)) {
            parsed.total_calories = 0;
            parsed.total_protein = 0;
            parsed.total_carbs = 0;
            parsed.total_fats = 0;

            parsed.meals.forEach(meal => {
                meal.calories = Math.round((meal.protein * 4) + (meal.carbs * 4) + (meal.fats * 9));
                parsed.total_calories += meal.calories;
                parsed.total_protein += meal.protein;
                parsed.total_carbs += meal.carbs;
                parsed.total_fats += meal.fats;
            });
        }
        
        return parsed;
    } catch (error) {
        console.error("Error generating meal plan:", error);
        throw error;
    }
}
