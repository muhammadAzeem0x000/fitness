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

    let privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');
    
    // If powershell stripped the newlines entirely, reconstruct the PEM format
    if (privateKey.indexOf('\n') === -1 || privateKey.split('\n').length <= 3) {
        let base64Part = privateKey
            .replace('-----BEGIN PRIVATE KEY-----', '')
            .replace('-----END PRIVATE KEY-----', '')
            .replace(/\s/g, '');
        const chunks = base64Part.match(/.{1,64}/g) || [];
        privateKey = `-----BEGIN PRIVATE KEY-----\n${chunks.join('\n')}\n-----END PRIVATE KEY-----\n`;
    }

    const client = new JWT({
        email: serviceAccount.client_email,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });

    const token = await client.getAccessToken();
    return { token: token.token, projectId: serviceAccount.project_id };
};

const sendPushNotification = async (fcmToken, title, body, reportId) => {
    try {
        const { token, projectId } = await getFirebaseAccessToken();
        const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

        const payload = {
            message: {
                token: fcmToken,
                notification: { title, body },
                data: { route: '/ai-coach', reportId: String(reportId || '') }
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
            const errText = await res.text();
            console.error('Failed to send push:', errText);
            return { success: false, error: errText };
        }
        return { success: true };
    } catch (err) {
        console.error('Error sending push:', err);
        return { success: false, error: err.message };
    }
};

const generateReport = async (userId, reportType, supabase, force = false) => {
    console.log(`Generating ${reportType} report for ${userId} (force: ${force})`);

    // 1. Fetch user data
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (reportType === 'monthly' ? 30 : 7));

    const [{ data: workouts }, { data: weights }, { data: nutrition }] = await Promise.all([
        supabase.from('workout_logs').select('*').eq('user_id', userId).gte('date', cutoffDate.toISOString()),
        supabase.from('weight_logs').select('*').eq('user_id', userId).gte('date', cutoffDate.toISOString()),
        supabase.from('nutrition_logs').select('*').eq('user_id', userId).gte('date', cutoffDate.toISOString()),
    ]);

    // Check if user is active (has any logs)
    if (!force && (!workouts || workouts.length === 0) && (!weights || weights.length === 0) && (!nutrition || nutrition.length === 0)) {
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
        report_text: markdown
    }).select().single();

    if (error) throw error;
    return report;
};

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        let reqBody = {};
        if (req.method === 'POST') {
            try {
                reqBody = await req.json();
            } catch (e) { }
        }

        // For production, query all users needing a report
        const { data: users, error } = await supabase.from('profiles')
            .select('id')
            .eq('is_premium', true);

        if (error) throw error;

        for (const user of users) {
            // Check Weekly
            const { data: lastWeekly } = await supabase.from('ai_reports')
                .select('created_at')
                .eq('user_id', user.id)
                .eq('report_type', 'weekly')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            const needsWeekly = !lastWeekly || (new Date() - new Date(lastWeekly.created_at)) > 7 * 24 * 60 * 60 * 1000;

            if (needsWeekly) {
                const report = await generateReport(user.id, 'weekly', supabase, false);
                if (report) {
                    const { data: devices } = await supabase.from('user_devices').select('fcm_token').eq('user_id', user.id);
                    if (devices) {
                        for (const device of devices) {
                            await sendPushNotification(
                                device.fcm_token, 
                                "Weekly AI Report Ready 📊", 
                                "Your new personalized weekly insights are available.",
                                report.id
                            );
                        }
                    }
                }
            }

            // Check Monthly
            const { data: lastMonthly } = await supabase.from('ai_reports')
                .select('created_at')
                .eq('user_id', user.id)
                .eq('report_type', 'monthly')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            const needsMonthly = !lastMonthly || (new Date() - new Date(lastMonthly.created_at)) > 30 * 24 * 60 * 60 * 1000;

            if (needsMonthly) {
                const report = await generateReport(user.id, 'monthly', supabase, false);
                if (report) {
                    const { data: devices } = await supabase.from('user_devices').select('fcm_token').eq('user_id', user.id);
                    if (devices) {
                        for (const device of devices) {
                            await sendPushNotification(
                                device.fcm_token, 
                                "Monthly AI Report Ready 🏆", 
                                "Your comprehensive monthly transformation analysis is ready.",
                                report.id
                            );
                        }
                    }
                }
            }
        }

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
});
