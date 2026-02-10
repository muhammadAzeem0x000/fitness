import { supabase } from './supabase';

/**
 * Check if user can use a rate-limited feature (for free tier)
 * @param {string} userId - User ID
 * @param {string} featureName - Feature name (e.g., 'ai_report_total')
 * @param {number} limit - Maximum usage count for the period
 * @param {number} periodDays - Reset period in days (e.g., 30 for monthly)
 * @returns {Promise<{allowed: boolean, remaining: number, resetDate: Date}>}
 */
export async function checkFeatureUsage(userId, featureName, limit, periodDays = 30) {
    try {
        // Fetch current usage
        const { data: usage, error } = await supabase
            .from('feature_usage')
            .select('*')
            .eq('user_id', userId)
            .eq('feature_name', featureName)
            .single();

        const now = new Date();

        // If no usage record exists, create one
        if (error && error.code === 'PGRST116') {
            await supabase.from('feature_usage').insert({
                user_id: userId,
                feature_name: featureName,
                usage_count: 0,
                period_start: now.toISOString(),
                last_used_at: now.toISOString(),
            });

            return {
                allowed: true,
                remaining: limit,
                resetDate: new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000),
            };
        }

        if (error) throw error;

        // Check if period has expired
        const periodStart = new Date(usage.period_start);
        const daysSincePeriod = (now - periodStart) / (1000 * 60 * 60 * 24);

        // Reset if period expired
        if (daysSincePeriod >= periodDays) {
            await supabase
                .from('feature_usage')
                .update({
                    usage_count: 0,
                    period_start: now.toISOString(),
                })
                .eq('user_id', userId)
                .eq('feature_name', featureName);

            return {
                allowed: true,
                remaining: limit,
                resetDate: new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000),
            };
        }

        // Check if limit exceeded
        const allowed = usage.usage_count < limit;
        const remaining = Math.max(0, limit - usage.usage_count);
        const resetDate = new Date(periodStart.getTime() + periodDays * 24 * 60 * 60 * 1000);

        return { allowed, remaining, resetDate };
    } catch (error) {
        console.error('Error checking feature usage:', error);
        throw error;
    }
}

/**
 * Increment feature usage count
 * @param {string} userId - User ID
 * @param {string} featureName - Feature name
 */
export async function incrementFeatureUsage(userId, featureName) {
    try {
        const now = new Date();

        // Try to increment existing record
        const { error } = await supabase.rpc('increment_feature_usage', {
            p_user_id: userId,
            p_feature_name: featureName,
        });

        // If function doesn't exist, fallback to manual update
        if (error) {
            const { data: usage } = await supabase
                .from('feature_usage')
                .select('usage_count')
                .eq('user_id', userId)
                .eq('feature_name', featureName)
                .single();

            await supabase
                .from('feature_usage')
                .update({
                    usage_count: (usage?.usage_count || 0) + 1,
                    last_used_at: now.toISOString(),
                })
                .eq('user_id', userId)
                .eq('feature_name', featureName);
        }
    } catch (error) {
        console.error('Error incrementing feature usage:', error);
        throw error;
    }
}

/**
 * Get all feature usage stats for a user
 * @param {string} userId - User ID
 */
export async function getFeatureUsageStats(userId) {
    const { data, error } = await supabase
        .from('feature_usage')
        .select('*')
        .eq('user_id', userId);

    if (error) throw error;
    return data || [];
}
