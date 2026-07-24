import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { JWT } from 'npm:google-auth-library';

// Get secrets from environment (set via Supabase CLI: supabase secrets set --env-file .env)
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY') ?? '';
const expectedFirebaseProjectId = Deno.env.get('FIREBASE_PROJECT_ID') ?? 'musclebot-app';
const notificationRetryWindowMs = 14 * 24 * 60 * 60 * 1000;
const maxNotificationAttempts = 168;

// Firebase Service Account parsing
const getFirebaseAccessToken = async () => {
    const serviceAccountStr = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    if (!serviceAccountStr) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT");
    const serviceAccount = JSON.parse(serviceAccountStr);

    if (!serviceAccount.client_email || !serviceAccount.private_key || !serviceAccount.project_id) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT is missing client_email, private_key, or project_id');
    }
    if (serviceAccount.project_id !== expectedFirebaseProjectId) {
        throw new Error(
            `Firebase project mismatch: service account uses ${serviceAccount.project_id}, ` +
            `but the Android app uses ${expectedFirebaseProjectId}`
        );
    }

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
    if (!token.token) throw new Error('Firebase service account returned an empty access token');
    return { token: token.token, projectId: serviceAccount.project_id };
};

const parseFirebaseError = async (response) => {
    const rawBody = await response.text();
    try {
        const parsed = JSON.parse(rawBody);
        const fcmDetail = parsed?.error?.details?.find(
            (detail) => detail?.['@type'] === 'type.googleapis.com/google.firebase.fcm.v1.FcmError'
        );
        return {
            code: fcmDetail?.errorCode || parsed?.error?.status || `HTTP_${response.status}`,
            message: parsed?.error?.message || rawBody || `Firebase returned HTTP ${response.status}`,
        };
    } catch {
        return {
            code: `HTTP_${response.status}`,
            message: rawBody || `Firebase returned HTTP ${response.status}`,
        };
    }
};

const sendPushNotification = async (firebaseAuth, fcmToken, title, body, reportId) => {
    const url = `https://fcm.googleapis.com/v1/projects/${firebaseAuth.projectId}/messages:send`;
    const payload = {
        message: {
            token: fcmToken,
            notification: { title, body },
            data: { route: '/ai-coach', reportId: String(reportId || '') },
            android: {
                priority: 'high',
                ttl: '86400s',
                notification: {
                    channel_id: 'ai_reports',
                    sound: 'default',
                },
            },
        }
    };

    try {
        for (let attempt = 0; attempt < 3; attempt++) {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${firebaseAuth.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const result = await res.json();
                return { success: true, messageId: result.name };
            }

            const firebaseError = await parseFirebaseError(res);
            const retryable = res.status === 429 || res.status >= 500;
            if (!retryable || attempt === 2) {
                return { success: false, ...firebaseError };
            }

            await new Promise((resolve) => setTimeout(resolve, 250 * (2 ** attempt)));
        }
    } catch (err) {
        return { success: false, code: 'FETCH_ERROR', message: err.message };
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

const updateNotificationFailure = async (supabase, report, message) => {
    const { error } = await supabase
        .from('ai_reports')
        .update({
            notification_attempts: (report.notification_attempts || 0) + 1,
            notification_last_error: String(message).slice(0, 1000),
        })
        .eq('id', report.id);

    if (error) throw error;
};

const deliverReportNotification = async (report, supabase, getFirebaseAuth, stats) => {
    stats.reportsAttempted++;

    const { data: devices, error: deviceError } = await supabase
        .from('user_devices')
        .select('fcm_token')
        .eq('user_id', report.user_id);

    if (deviceError) {
        await updateNotificationFailure(supabase, report, `Device lookup failed: ${deviceError.message}`);
        stats.reportsFailed++;
        console.error('Report notification device lookup failed', {
            reportId: report.id,
            reportType: report.report_type,
            error: deviceError.message,
        });
        return false;
    }

    if (!devices?.length) {
        await updateNotificationFailure(supabase, report, 'No registered FCM devices');
        stats.reportsFailed++;
        console.error('Report notification has no registered devices', {
            reportId: report.id,
            reportType: report.report_type,
        });
        return false;
    }

    const title = report.report_type === 'monthly'
        ? 'Monthly AI Report Ready \u{1F3C6}'
        : 'Weekly AI Report Ready \u{1F4CA}';
    const body = report.report_type === 'monthly'
        ? 'Your comprehensive monthly transformation analysis is ready.'
        : 'Your new personalized weekly insights are available.';

    let firebaseAuth;
    try {
        firebaseAuth = await getFirebaseAuth();
    } catch (error) {
        await updateNotificationFailure(supabase, report, error.message);
        stats.reportsFailed++;
        console.error('Firebase authorization failed', {
            reportId: report.id,
            reportType: report.report_type,
            error: error.message,
        });
        return false;
    }

    const results = [];
    for (const device of devices) {
        const result = await sendPushNotification(
            firebaseAuth,
            device.fcm_token,
            title,
            body,
            report.id
        );
        results.push(result);

        if (!result.success && result.code === 'UNREGISTERED') {
            const { error: deleteError } = await supabase
                .from('user_devices')
                .delete()
                .eq('fcm_token', device.fcm_token);
            if (deleteError) {
                console.error('Failed to remove an unregistered FCM token', deleteError.message);
            }
        }
    }

    const successfulSends = results.filter((result) => result.success).length;
    const failedSends = results.length - successfulSends;
    const errorSummary = [...new Set(
        results
            .filter((result) => !result.success)
            .map((result) => `${result.code}: ${result.message}`)
    )].join(' | ').slice(0, 1000);

    const update = successfulSends > 0
        ? {
            notification_attempts: (report.notification_attempts || 0) + 1,
            notification_last_error: failedSends > 0 ? errorSummary : null,
            notification_sent_at: new Date().toISOString(),
        }
        : {
            notification_attempts: (report.notification_attempts || 0) + 1,
            notification_last_error: errorSummary || 'Firebase returned no successful sends',
        };

    const { error: updateError } = await supabase
        .from('ai_reports')
        .update(update)
        .eq('id', report.id);
    if (updateError) throw updateError;

    stats.deviceSendsAttempted += results.length;
    stats.deviceSendsSucceeded += successfulSends;
    stats.deviceSendsFailed += failedSends;

    if (successfulSends > 0) {
        stats.reportsDelivered++;
        console.log('Report notification delivered', {
            reportId: report.id,
            reportType: report.report_type,
            successfulSends,
            failedSends,
        });
        return true;
    }

    stats.reportsFailed++;
    console.error('All Firebase sends failed for report', {
        reportId: report.id,
        reportType: report.report_type,
        deviceCount: devices.length,
        error: errorSummary,
    });
    return false;
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
        const notificationStats = {
            reportsAttempted: 0,
            reportsDelivered: 0,
            reportsFailed: 0,
            deviceSendsAttempted: 0,
            deviceSendsSucceeded: 0,
            deviceSendsFailed: 0,
        };
        let firebaseAuthPromise;
        const getFirebaseAuth = () => {
            if (!firebaseAuthPromise) {
                firebaseAuthPromise = getFirebaseAccessToken();
            }
            return firebaseAuthPromise;
        };

        let reqBody = {};
        if (req.method === 'POST') {
            try {
                reqBody = await req.json();
            } catch (e) { }
        }

        // Retry recent reports whose first notification attempt failed. The
        // old one-shot flow permanently lost the notification after creating
        // the report whenever Firebase returned an error.
        const retryCutoff = new Date(Date.now() - notificationRetryWindowMs).toISOString();
        const { data: pendingReports, error: pendingError } = await supabase
            .from('ai_reports')
            .select('id, user_id, report_type, notification_attempts, created_at')
            .is('notification_sent_at', null)
            .gte('created_at', retryCutoff)
            .lt('notification_attempts', maxNotificationAttempts)
            .order('created_at', { ascending: true })
            .limit(100);

        if (pendingError) throw pendingError;

        for (const pendingReport of pendingReports || []) {
            await deliverReportNotification(
                pendingReport,
                supabase,
                getFirebaseAuth,
                notificationStats
            );
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
                    await deliverReportNotification(
                        { ...report, notification_attempts: 0 },
                        supabase,
                        getFirebaseAuth,
                        notificationStats
                    );
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
                    await deliverReportNotification(
                        { ...report, notification_attempts: 0 },
                        supabase,
                        getFirebaseAuth,
                        notificationStats
                    );
                }
            }
        }

        const allAttemptedDeliveriesFailed =
            notificationStats.reportsAttempted > 0 &&
            notificationStats.reportsDelivered === 0;

        return new Response(JSON.stringify({
            success: !allAttemptedDeliveriesFailed,
            notifications: notificationStats,
        }), {
            status: allAttemptedDeliveriesFailed ? 502 : 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
