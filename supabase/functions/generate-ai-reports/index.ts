import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { JWT } from 'npm:google-auth-library';

// Get secrets from environment (set via Supabase CLI: supabase secrets set --env-file .env)
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY') ?? '';

// Firebase Service Account parsing
const getFirebaseAccessToken = async () => {
    const serviceAccountStr = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    if (!serviceAccountStr) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT");
    const serviceAccount = JSON.parse(serviceAccountStr);

    const client = new JWT({
        email: serviceAccount.client_email,
        key: serviceAccount.private_key,
        scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });

    const token = await client.getAccessToken();
    return { token: token.token, projectId: serviceAccount.project_id };
};

const sendPushNotification = async (fcmToken, title, body) => {
    try {
        const { token, projectId } = await getFirebaseAccessToken();
        const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
        
        const payload = {
            message: {
                token: fcmToken,
                notification: { title, body },
                data: { route: '/ai-coach' }
            }
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
            console.error('Failed to send push:', await res.text());
        }
    } catch (err) {
        console.error('Error sending push:', err);
    }
};

const generateReport = async (userId, reportType, supabase) => {
    console.log(`Generating ${reportType} report for ${userId}`);
    
    // 1. Fetch user data (simplified for brevity, you'll want to add logic to format prompts exactly like openai.js)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (reportType === 'monthly' ? 30 : 7));
    
    const [{ data: workouts }, { data: weights }, { data: nutrition }] = await Promise.all([
        supabase.from('workout_logs').select('*').eq('user_id', userId).gte('date', cutoffDate.toISOString()),
        supabase.from('weight_logs').select('*').eq('user_id', userId).gte('date', cutoffDate.toISOString()),
        supabase.from('nutrition_logs').select('*').eq('user_id', userId).gte('date', cutoffDate.toISOString()),
    ]);

    // Check if user is active (has any logs)
    if ((!workouts || workouts.length === 0) && (!weights || weights.length === 0) && (!nutrition || nutrition.length === 0)) {
        console.log(`Skipping ${userId} - no activity in the last ${reportType === 'monthly' ? 30 : 7} days.`);
        return null; // Skip inactive user
    }

    // Call DeepSeek
    const prompt = `You are an elite fitness coach. Analyze this data for a ${reportType} report... (Data: ${workouts?.length} workouts, ${weights?.length} weigh-ins)`;
    
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${deepseekApiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "deepseek-v4-flash",
            messages: [{ role: "system", content: prompt }]
        })
    });

    if (!res.ok) throw new Error("DeepSeek API error: " + await res.text());
    
    const aiData = await res.json();
    const markdown = aiData.choices[0].message.content;

    // Save to DB
    const { data: report, error } = await supabase.from('ai_reports').insert({
        user_id: userId,
        report_type: reportType,
        content: markdown,
        metrics: {} // Add calculated metrics here if needed
    }).select().single();

    if (error) throw error;
    return report;
};

serve(async (req) => {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // This function would be triggered by pg_cron or HTTP POST
        // For production, we'd query all users needing a report
        const { data: users, error } = await supabase.from('user_subscriptions')
            .select('user_id')
            .eq('is_premium', true);
            
        if (error) throw error;

        for (const user of users) {
            // Check if they need a weekly report (last report > 7 days ago)
            const { data: lastReport } = await supabase.from('ai_reports')
                .select('created_at')
                .eq('user_id', user.user_id)
                .eq('report_type', 'weekly')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            const needsWeekly = !lastReport || (new Date() - new Date(lastReport.created_at)) > 7 * 24 * 60 * 60 * 1000;
            
            if (needsWeekly) {
                const report = await generateReport(user.user_id, 'weekly', supabase);
                if (report) {
                    // Send push notification
                    const { data: devices } = await supabase.from('user_devices').select('fcm_token').eq('user_id', user.user_id);
                    if (devices) {
                        for (const device of devices) {
                            await sendPushNotification(device.fcm_token, "Your Weekly Report is Ready! 📊", "Tap to review your progress and get AI coaching for next week.");
                        }
                    }
                }
            }
        }

        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
});
