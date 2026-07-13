import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;

const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.deepseek.com/v1',
    dangerouslyAllowBrowser: true
});

const groqClient = new OpenAI({
    apiKey: groqApiKey,
    baseURL: 'https://api.groq.com/openai/v1',
    dangerouslyAllowBrowser: true
});

export async function generateHealthReport(weightHistory, workoutLogs, nutritionLogs, previousReport, reportType = 'weekly', userProfile = {}) {
    if (!apiKey) {
        throw new Error("Missing DeepSeek API Key");
    }

    const { displayName, workoutDays, targetWeight } = userProfile;

    // Filter Data based on Type
    let daysToLookBack = 8; // Weekly report (7-8 days)
    let promoText = "";

    if (reportType === 'monthly') daysToLookBack = 32; // 1 month+

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToLookBack);

    const relevantWeights = weightHistory.filter(w => new Date(w.date) >= cutoffDate);
    const relevantWorkouts = workoutLogs.filter(w => new Date(w.date) >= cutoffDate);
    const relevantNutrition = nutritionLogs?.filter(n => new Date(n.date) >= cutoffDate) || [];

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

    // --- Nutrition Aggregation ---
    let totalCals = 0;
    let totalProtein = 0;
    let daysTracked = new Set();
    relevantNutrition.forEach(n => {
        totalCals += n.calories || 0;
        totalProtein += n.protein || 0;
        daysTracked.add(new Date(n.date).toLocaleDateString());
    });
    const avgCals = daysTracked.size > 0 ? Math.round(totalCals / daysTracked.size) : 0;
    const avgProtein = daysTracked.size > 0 ? Math.round(totalProtein / daysTracked.size) : 0;

    // Check if this is a fresh account (no workout data)
    const isFreshAccount = relevantWorkouts.length === 0 && relevantNutrition.length === 0;

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
    
    --- NUTRITION ---
    Days Tracked (in ${daysToLookBack} days): ${daysTracked.size}
    Average Daily Calories: ${avgCals > 0 ? avgCals + ' kcal' : 'No data'}
    Average Daily Protein: ${avgProtein > 0 ? avgProtein + ' g' : 'No data'}
        `;
    }

    let specificInstruction = "";
    if (isFreshAccount) {
        specificInstruction = `This user has not logged any workouts or nutrition yet. Based on their profile data, provide:
        1. Encouragement to start their fitness journey
        2. Beginner-friendly workout plan and nutrition recommendations based on their goals
        3. Tips for getting started with the MuscleBot app
        Keep it motivating and actionable. Don't mention lack of data negatively - focus on the exciting journey ahead.`;
    } else if (reportType === 'weekly') {
        specificInstruction = "Analyze volume trends, nutrition consistency (e.g., protein intake vs goals), and weight trend over the last week. Give 3 actionable tips for next week.";
    } else {
        specificInstruction = "Analyze hypertrophy progress, adherence to nutrition, and weight trend over the month. Look for long-term consistency issues or wins.";
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
            model: "deepseek-v4-flash",
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
    availableExercises = [],
    readinessData = null,
    healthData = null
}) {
    if (!apiKey) {
        throw new Error("Missing DeepSeek API Key");
    }

    const { displayName, currentWeight, height, targetWeight } = userProfile;

    // Build recent workout context (last 7 days) and extract strength profile
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const recentWorkouts = workoutHistory.filter(w => new Date(w.date) >= cutoff);
    
    let strengthProfile = {}; // Store max weight/reps per exercise

    let recentWorkoutSummary = "No recent workouts.";
    if (recentWorkouts.length > 0) {
        recentWorkoutSummary = recentWorkouts.map(w => {
            let exerciseNames = [];
            const exData = w.exercises;
            
            let exArray = [];
            if (exData && typeof exData === 'object' && !Array.isArray(exData)) {
                // Object format
                exArray = Object.entries(exData).map(([name, sets]) => ({ name, sets }));
            } else if (Array.isArray(exData)) {
                exArray = exData;
            }

            exArray.forEach(ex => {
                const name = ex.name || ex;
                exerciseNames.push(name);
                
                // Track max weight
                if (ex.sets && Array.isArray(ex.sets)) {
                    ex.sets.forEach(set => {
                        const weight = parseFloat(set.weight) || 0;
                        const reps = parseInt(set.reps) || 0;
                        if (!strengthProfile[name] || weight > (strengthProfile[name].weight || 0)) {
                            strengthProfile[name] = { weight, reps, date: w.date };
                        }
                    });
                }
            });
            return `- ${w.type || 'Workout'} (${new Date(w.date).toLocaleDateString()}): ${exerciseNames.slice(0, 5).join(', ')}`;
        }).join('\n');
    }

    let strengthString = Object.keys(strengthProfile).length > 0 
        ? Object.entries(strengthProfile).map(([name, data]) => `- ${name}: ${data.weight}kg x ${data.reps} reps (last done ${new Date(data.date).toLocaleDateString()})`).join('\n')
        : "No strength data available.";

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

    let readinessContext = '';
    if (readinessData && healthData) {
        readinessContext = `
HEALTH & READINESS CONTEXT:
- Readiness Score: ${readinessData.score}/100 (${readinessData.status})
- Last Night's Sleep: ${healthData.sleep_hours || 0} hours
- AI Recommendation: ${readinessData.recommendation}

CRITICAL ADJUSTMENT: You MUST adapt the workout intensity based on the Readiness Score. 
If the score is Low (<40), lower the volume/intensity and prioritize active recovery, even if the user asks for heavy training.
If the score is High (>70), feel free to push them hard.
        `;
    }

    // Dynamic exercise count based on both DURATION and GOAL
    let isStrength = goal.toLowerCase().includes('strength');
    let isFatLossOrEndurance = goal.toLowerCase().includes('fat') || goal.toLowerCase().includes('endurance') || goal.toLowerCase().includes('weight');
    
    let exerciseCountRule = "Generate 6-8 exercises.";
    if (isStrength) {
        if (duration === '30') exerciseCountRule = "Generate exactly 3-4 exercises. Prioritize heavy compound lifts with long rest periods.";
        else if (duration === '45') exerciseCountRule = "Generate exactly 4-5 exercises. Prioritize heavy compound lifts with long rest periods.";
        else if (duration === '60') exerciseCountRule = "Generate exactly 5-6 exercises. Prioritize heavy compound lifts with long rest periods.";
        else if (duration === '90') exerciseCountRule = "Generate exactly 6-8 exercises. Prioritize heavy compound lifts with long rest periods.";
    } else if (isFatLossOrEndurance) {
        if (duration === '30') exerciseCountRule = "Generate exactly 5-7 exercises. Use circuit style or super-sets with short rest periods.";
        else if (duration === '45') exerciseCountRule = "Generate exactly 7-9 exercises. Use circuit style or super-sets with short rest periods.";
        else if (duration === '60') exerciseCountRule = "Generate exactly 9-12 exercises. Use circuit style or super-sets with short rest periods.";
        else if (duration === '90') exerciseCountRule = "Generate exactly 12-15 exercises. Use circuit style or super-sets with short rest periods.";
    } else {
        // Hypertrophy / Muscle Growth (Balanced)
        if (duration === '30') exerciseCountRule = "Generate exactly 4-5 exercises to fit a 30-minute hypertrophy window.";
        else if (duration === '45') exerciseCountRule = "Generate exactly 5-7 exercises to fit a 45-minute hypertrophy window.";
        else if (duration === '60') exerciseCountRule = "Generate exactly 7-9 exercises to fit a 60-minute hypertrophy window.";
        else if (duration === '90') exerciseCountRule = "Generate exactly 9-11 exercises to fit a 90-minute hypertrophy window.";
    }

    const systemPrompt = `You are an elite fitness coach. Generate a personalized workout plan.

USER PROFILE:
- Name: ${displayName || "Athlete"}
- Current Weight: ${currentWeight ? currentWeight + 'kg' : 'Unknown'}
- Height: ${height ? height + 'cm' : 'Unknown'}
- Target Weight: ${targetWeight ? targetWeight + 'kg' : 'Not set'}

RECENT WORKOUTS (last 7 days):
${recentWorkoutSummary}

STRENGTH PROFILE (Max weights used recently):
${strengthString}
${readinessContext}

AVAILABLE EXERCISES:
${exerciseListString}

RULES:
1. Use ONLY exact exercise names from the AVAILABLE EXERCISES list above.
2. ${exerciseCountRule}
3. PROGRESSIVE OVERLOAD: If the user did an exercise recently (check STRENGTH PROFILE), suggest increasing the weight by 2.5kg or increasing the reps by 1-2.
4. Consider what the user trained recently to avoid overtraining the same muscles.
5. Tailor sets, reps, and rest to the user's stated goal.
6. You MUST respond with ONLY valid JSON, no markdown, no code fences, no explanation text.

RESPONSE FORMAT (strict JSON):
{
  "planName": "Short descriptive name for the workout",
  "exercises": [
    {
      "name": "Exact exercise name from the list",
      "sets": 3,
      "reps": 10,
      "restSeconds": 90,
      "notes": "Brief coaching cue + progressive overload target if applicable (e.g., 'Aim for 82.5kg today')"
    }
  ],
  "summary": "1-2 sentence description of the workout",
  "estimatedDuration": "45 min",
  "coachTip": "One motivational or strategic tip for this session"
}`;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userRequest }
            ],
            model: "deepseek-v4-flash",
            temperature: 0.5,
            max_tokens: 3000,
            response_format: { type: "json_object" }
        });

        let rawContent = completion.choices[0].message.content || "{}";

        // Remove <think> blocks just in case
        let cleanedContent = rawContent.replace(new RegExp('<think>[\\\\s\\\\S]*?<\\\\/think>\\\\n?', 'g'), '').trim();
        
        // Extract the JSON object using regex
        const match = cleanedContent.match(/\{[\s\S]*\}/);
        let jsonString = match ? match[0] : "{}";

        // Fix potential trailing commas
        jsonString = jsonString.replace(/,\s*([\]}])/g, '$1');

        let plan;
        try {
            plan = JSON.parse(jsonString);
        } catch (parseError) {
            console.error("JSON Parse failed. String:", jsonString);
            throw new Error(`Parse Error: ${parseError.message}`);
        }
        
        // Validate structure
        if (!plan.exercises || !Array.isArray(plan.exercises) || plan.exercises.length === 0) {
            throw new Error(`AI generated an empty workout plan.`);
        }

        return plan;
    } catch (error) {
        console.error("Workout Plan Generation Error:", error);
        const message = error?.error?.message || error.message || "Unknown Error";
        throw new Error(message);
    }
}

// --- NEW: Phase 2 Nutrition AI Functions ---

export async function getInSessionAdvice(currentExercises) {
    if (!apiKey) {
        throw new Error("Missing DeepSeek API Key");
    }

    const systemPrompt = `You are a fitness coach. The user is in the middle of a workout and wants exercise suggestions.

CURRENT EXERCISES IN SESSION: ${currentExercises.join(', ')}

Based on what they've already done, suggest 3 complementary exercises that would:
1. Complete the muscle group coverage for this session
2. Target synergistic muscles that were already engaged
3. Avoid overworking the same exact movement patterns

Respond with ONLY valid JSON, no markdown, no code fences:
{
  "suggestions": [
    {
      "name": "Exercise Name",
      "reason": "Brief 1-line reason why this complements the session"
    }
  ],
  "analysis": "Brief 1-line analysis of what they've covered so far"
}`;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: systemPrompt }],
            model: "deepseek-v4-flash",
            temperature: 0.7,
            max_tokens: 500,
            response_format: { type: "json_object" }
        });

        let cleanedContent = completion.choices[0].message.content.replace(new RegExp('<think>[\\\\s\\\\S]*?<\\\\/think>\\\\n?', 'g'), '').trim();
        const match = cleanedContent.match(/\{[\s\S]*\}/);
        let jsonString = match ? match[0] : "{}";
        jsonString = jsonString.replace(/,\s*([\]}])/g, '$1');

        return JSON.parse(jsonString);
    } catch (error) {
        console.error("In-Session Advice Error:", error);
        throw new Error("Failed to get suggestions.");
    }
}

/**
 * Parses natural language food descriptions into estimated calories and macros.
 * Uses Groq to return a strict JSON object.
 */
export async function analyzeFoodInput(text) {
    if (!groqApiKey) throw new Error("Missing Groq API Key");

    const prompt = `
    You are a professional sports nutritionist and calorie estimator API.
    The user will provide a text describing what they ate.
    You must break it down into INDIVIDUAL food items, each with their own macros.
    
    IMPORTANT RULES:
    1. Be as accurate and realistic as possible. Do not aggressively over-estimate or under-estimate.
    2. Account for standard hidden calories (normal cooking oils, sauces).
    3. If the user doesn't specify portion size, assume a standard adult serving.
    4. Enforce strict macro-calorie math per item: (Protein*4) + (Carbs*4) + (Fats*9) = Calories.
    5. Break compound meals into their component foods (e.g. "2 eggs and toast" → 2 items).
    
    FEW-SHOT CALIBRATION EXAMPLES:
    Input: "200g chicken breast"
    Output: {"foods":[{"name":"Chicken Breast","quantity":200,"unit":"g","prep":"grilled","calories":311,"protein":62,"carbs":0,"fats":7}],"food_name":"Chicken Breast (200g)"}
    
    Input: "2 eggs and toast with butter"
    Output: {"foods":[{"name":"Eggs","quantity":2,"unit":"large","prep":"boiled","calories":155,"protein":12,"carbs":1,"fats":11},{"name":"Toast","quantity":1,"unit":"slice","prep":"toasted","calories":79,"protein":3,"carbs":13,"fats":1},{"name":"Butter","quantity":1,"unit":"tbsp","prep":"spread","calories":102,"protein":0,"carbs":0,"fats":12}],"food_name":"Eggs, Toast & Butter"}
    
    Input: "2 roti with chicken curry"
    Output: {"foods":[{"name":"Roti","quantity":2,"unit":"piece","prep":"cooked","calories":220,"protein":6,"carbs":40,"fats":4},{"name":"Chicken Curry","quantity":1,"unit":"serving","prep":"cooked","calories":290,"protein":29,"carbs":12,"fats":14}],"food_name":"2 Roti & Chicken Curry"}
    
    CRITICAL INSTRUCTION: Return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
    Format required:
    {
      "foods": [
        {
          "name": "Food name",
          "quantity": number,
          "unit": "g|ml|piece|slice|cup|tbsp|serving|large|medium|small",
          "prep": "raw|boiled|fried|grilled|baked|steamed|toasted|cooked|spread",
          "calories": number,
          "protein": number,
          "carbs": number,
          "fats": number
        }
      ],
      "food_name": "A short 2-4 word summary of the entire meal"
    }
    
    User Input: "${text}"
    `;

    try {
        const response = await groqClient.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            max_tokens: 1000,
            response_format: { type: "json_object" }
        });

        const rawContent = response.choices[0]?.message?.content || "{}";
        let cleanedContent = rawContent.replace(new RegExp('<think>[\\s\\S]*?<\\/think>\\n?', 'g'), '').trim();
        
        const match = cleanedContent.match(/\{[\s\S]*\}/);
        let jsonContent = match ? match[0] : "{}";
        
        // Fix trailing commas
        jsonContent = jsonContent.replace(/,\s*([\]}])/g, '$1');

        let parsed;
        try {
            parsed = JSON.parse(jsonContent);
        } catch (e) {
            console.error("Food JSON parse error:", e, jsonContent);
            // Fallback: wrap the whole input as a single food item
            parsed = { foods: [{ name: text, quantity: 1, unit: "serving", prep: "as described", calories: 0, protein: 0, carbs: 0, fats: 0 }], food_name: text };
        }

        // Ensure foods array exists (backwards compat if AI returns old format)
        if (!parsed.foods || !Array.isArray(parsed.foods)) {
            parsed = {
                foods: [{
                    name: parsed.food_name || text,
                    quantity: 1,
                    unit: "serving",
                    prep: "as described",
                    calories: parsed.calories || 0,
                    protein: parsed.protein || 0,
                    carbs: parsed.carbs || 0,
                    fats: parsed.fats || 0
                }],
                food_name: parsed.food_name || text
            };
        }
        
        // Validate and clamp each food item — prevent negatives and unrealistic values
        parsed.foods = parsed.foods.map(food => ({
            ...food,
            quantity: Math.max(0, food.quantity || 1),
            protein: Math.max(0, Math.min(food.protein || 0, 300)),
            carbs: Math.max(0, Math.min(food.carbs || 0, 500)),
            fats: Math.max(0, Math.min(food.fats || 0, 200)),
            // Recalculate calories from macros using 4/4/9 rule
            calories: Math.round(
                (Math.max(0, Math.min(food.protein || 0, 300)) * 4) +
                (Math.max(0, Math.min(food.carbs || 0, 500)) * 4) +
                (Math.max(0, Math.min(food.fats || 0, 200)) * 9)
            )
        }));

        // Calculate totals from individual items (code-calculated, not AI)
        parsed.calories = parsed.foods.reduce((sum, f) => sum + f.calories, 0);
        parsed.protein = parsed.foods.reduce((sum, f) => sum + f.protein, 0);
        parsed.carbs = parsed.foods.reduce((sum, f) => sum + f.carbs, 0);
        parsed.fats = parsed.foods.reduce((sum, f) => sum + f.fats, 0);

        return parsed;
    } catch (error) {
        console.error("Error parsing food input:", error);
        throw error;
    }
}

/**
 * Recalculates the macros for a single food item when unit or prep method changes.
 */
export async function recalculateFoodItem({ name, quantity, unit, prep }) {
    if (!groqApiKey) throw new Error("Missing Groq API Key");

    const prompt = `You are a sports nutritionist AI. 
Calculate the nutritional macros for this specific food item:
Name: ${name}
Quantity: ${quantity}
Unit: ${unit}
Preparation: ${prep}

Respond ONLY with a valid JSON object matching exactly this structure (use numbers, not strings):
{
  "protein": number,
  "carbs": number,
  "fats": number
}
Do not include any text, markdown formatting, or <think> tags. Just the JSON object.`;

    try {
        const response = await groqClient.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            max_tokens: 150,
            response_format: { type: "json_object" }
        });

        const rawContent = response.choices[0]?.message?.content || "{}";
        let cleanedContent = rawContent.replace(new RegExp('<think>[\\\\s\\\\S]*?<\\\\/think>\\\\n?', 'g'), '').trim();
        const match = cleanedContent.match(/\{[\s\S]*\}/);
        const jsonContent = match ? match[0] : "{}";
        const parsed = JSON.parse(jsonContent);

        const protein = Math.max(0, Math.min(parsed.protein || 0, 300));
        const carbs = Math.max(0, Math.min(parsed.carbs || 0, 500));
        const fats = Math.max(0, Math.min(parsed.fats || 0, 200));
        const calories = Math.round((protein * 4) + (carbs * 4) + (fats * 9));

        return { protein, carbs, fats, calories };
    } catch (error) {
        console.error("Error recalculating food item:", error);
        throw error;
    }
}

/**
 * Generates a meal plan (1, 7, or 14 days) based on target macros and preferences.
 */
export async function generateMealPlan(params) {
    const { targets, goal, diet, exclusions, mealsPerDay, cuisine, days, foodHistory = [], complexity = 'Quick & Easy' } = params;
    if (!groqApiKey) throw new Error("Missing Groq API Key");

    const recentMealsStr = foodHistory.length > 0 
        ? foodHistory.slice(0, 20).map(f => `- ${f.food_text || f.name} (${f.calories} kcal)`).join('\n')
        : "No recent logged meals.";

    const prompt = `You are a world-class AI Sports Nutritionist. 
Your task is to generate a structured, multi-day meal plan for the user.

USER PROFILE & CONSTRAINTS:
- Daily Calorie Target: ~${targets.calories} kcal
- Daily Macros: ${targets.protein}g Protein, ${targets.carbs}g Carbs, ${targets.fats}g Fats
- Primary Goal: ${goal || 'Balance'}
- Diet Type: ${diet}
- Exclusions/Allergies: ${exclusions && exclusions.length > 0 ? exclusions.join(', ') : 'None'}
- Meals per day: ${mealsPerDay}
- Cuisine preference: ${cuisine}
- Cooking Complexity: ${complexity}
- Duration: ${days} days

RECENT LOGGED MEALS (For Inspiration & Grounding):
${recentMealsStr}

INSTRUCTIONS:
1. Create exactly ${days} unique daily templates. The output JSON must contain a "days" array with ${days} objects.
2. For the Primary Goal ("${goal || 'Balance'}"), select appropriate food volumes.
3. The total calories and macros for EACH day MUST be within +/- 5% of the Daily Targets.
4. Distribute the food across exactly ${mealsPerDay} meals per day.
5. Provide realistic, tasty meals that fit the cuisine preference, diet type, and cooking complexity.
6. NO hallucinatory foods. Keep it practical.
7. DO NOT REPEAT the same meals across days unless it's a staple like oatmeal or a protein shake.

FEW-SHOT EXAMPLES (What a GOOD meal looks like vs BAD meal):
GOOD (Quick & Easy): "Chicken breast with microwave rice and mixed greens"
BAD: "Pan-seared quinoa-crusted salmon with a balsamic reduction" (Too complex/fancy)

You MUST respond ONLY with a valid JSON object. Do not include markdown formatting.
    Format required:
    {
      "days": [
        {
          "day": 1,
          "meals": [
            {
              "type": "Breakfast", // or Lunch, Dinner, Snack
              "name": "Meal name",
              "description": "Short description of ingredients",
              "calories": number,
              "protein": number,
              "carbs": number,
              "fats": number
            }
          ]
        }
      ]
    }
    `;

    try {
        const response = await groqClient.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 4000,
            response_format: { type: "json_object" }
        });

        const rawContent = response.choices[0]?.message?.content || "{}";
        let cleanedContent = rawContent.replace(new RegExp('<think>[\\\\s\\\\S]*?<\\\\/think>\\\\n?', 'g'), '').trim();
        const match = cleanedContent.match(/\{[\s\S]*\}/);
        const jsonContent = match ? match[0] : "{}";
        const parsedPlan = JSON.parse(jsonContent);
        
        // Enforce 4/4/9 strict mathematical accuracy on all meals across all days
        if (parsedPlan.days && Array.isArray(parsedPlan.days)) {
            parsedPlan.days.forEach(day => {
                if (day.meals && Array.isArray(day.meals)) {
                    day.meals.forEach(meal => {
                        meal.calories = Math.round((meal.protein * 4) + (meal.carbs * 4) + (meal.fats * 9));
                    });
                }
            });
        }
        
        return parsedPlan;

    } catch (error) {
        console.error("Error generating meal plan:", error);
        throw error;
    }
}

/**
 * Regenerates a single meal within a plan without regenerating the entire plan.
 * Takes the current meal's constraints and returns a new meal that fits the same slot.
 */
export async function regenerateSingleMeal({ mealType, targetCalories, targetProtein, targetCarbs, targetFats, diet, exclusions, cuisine, complexity, currentMealName }) {
    if (!groqApiKey) throw new Error("Missing Groq API Key");

    const prompt = `You are a world-class AI Sports Nutritionist.
Generate ONE replacement meal for the "${mealType}" slot.

CONSTRAINTS:
- Target Calories: ~${targetCalories} kcal
- Target Macros: ~${targetProtein}g Protein, ~${targetCarbs}g Carbs, ~${targetFats}g Fats
- Diet Type: ${diet || 'Standard'}
- Exclusions: ${exclusions?.length > 0 ? exclusions.join(', ') : 'None'}
- Cuisine: ${cuisine || 'Any'}
- Complexity: ${complexity || 'Quick & Easy'}
- DO NOT repeat this meal: "${currentMealName}"

Respond ONLY with a valid JSON object:
{
  "type": "${mealType}",
  "name": "Meal name",
  "description": "Short description of ingredients and prep",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fats": number
}`;

    try {
        const response = await groqClient.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
            max_tokens: 500,
            response_format: { type: "json_object" }
        });

        const rawContent = response.choices[0]?.message?.content || "{}";
        let cleanedContent = rawContent.replace(new RegExp('<think>[\\\\s\\\\S]*?<\\\\/think>\\\\n?', 'g'), '').trim();
        const match = cleanedContent.match(/\{[\s\S]*\}/);
        const jsonContent = match ? match[0] : "{}";
        const meal = JSON.parse(jsonContent);

        // Clamp negatives and enforce 4/4/9
        meal.protein = Math.max(0, Math.min(meal.protein || 0, 300));
        meal.carbs = Math.max(0, Math.min(meal.carbs || 0, 500));
        meal.fats = Math.max(0, Math.min(meal.fats || 0, 200));
        meal.calories = Math.round((meal.protein * 4) + (meal.carbs * 4) + (meal.fats * 9));

        return meal;
    } catch (error) {
        console.error("Error regenerating single meal:", error);
        throw error;
    }
}
