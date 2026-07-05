import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { loginRevenueCat, getOfferings, checkTrialEligibility, getCustomerInfo } from '../lib/revenuecat';
import { isNativePlatform } from '../lib/platform';
import { supabase } from '../lib/supabase';

/**
 * Hook to manage user subscription status.
 * 
 * BULLETPROOF FLOW:
 * 1. Wait for auth → get Supabase user ID
 * 2. loginRevenueCat(userId) → AWAIT before step 3
 * 3. getCustomerInfo() → returns identified user's data
 * 4. Check BOTH entitlements.active AND activeSubscriptions
 *    (covers the case where RevenueCat entitlement mapping is misconfigured)
 * 5. Sync result to Supabase
 */
export function useSubscription() {
    const { user, loading: authLoading } = useAuth();
    const [isPremium, setIsPremium] = useState(false);
    const [offerings, setOfferings] = useState(null);
    const [isTrialEligible, setIsTrialEligible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [subscriptionData, setSubscriptionData] = useState({
        subscription: null,
        isTrialing: false,
        isCanceled: false,
        isTrialExpired: false
    });

    /**
     * Sync the resolved subscription state to Supabase.
     */
    const syncToSupabase = async (userId, { proIsActive, trialing, canceled, trialExpired, currentSubscription, rcAppUserId, entitlementId }) => {
        try {
            let status = 'inactive';
            if (proIsActive && trialing) status = 'trialing';
            else if (proIsActive && !trialing) status = 'active';
            else if (trialExpired) status = 'trial_expired';
            else if (canceled) status = 'canceled';

            const { error } = await supabase
                .from('subscriptions')
                .upsert({
                    user_id: userId,
                    status,
                    plan_id: currentSubscription?.plan_id || null,
                    current_period_start: currentSubscription?.current_period_start || null,
                    current_period_end: currentSubscription?.current_period_end || null,
                    cancel_at_period_end: canceled,
                    revenuecat_app_user_id: rcAppUserId || null,
                    revenuecat_entitlement_id: entitlementId || null,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) {
                console.error('[Sub] Supabase sync error:', error);
            } else {
                console.log('[Sub] Synced to Supabase:', status, rcAppUserId);
            }
        } catch (err) {
            console.error('[Sub] Failed to sync subscription to Supabase:', err);
        }
    };

    /**
     * Parse customerInfo to determine premium status.
     * Uses TWO methods for bulletproof detection:
     *   1. entitlements.active (proper way, requires entitlement mapping in RC dashboard)
     *   2. activeSubscriptions (fallback, works even without entitlement mapping)
     */
    const parseCustomerInfo = (customerInfo) => {
        let currentSubscription = null;
        let proIsActive = false;
        let trialing = false;
        let canceled = false;
        let trialExpired = false;
        let rcAppUserId = null;
        let entitlementId = null;

        if (!customerInfo) {
            return { currentSubscription, proIsActive, trialing, canceled, trialExpired, rcAppUserId, entitlementId };
        }

        rcAppUserId = customerInfo.originalAppUserId || null;

        // Log everything for debugging
        console.log('[Sub] === RevenueCat CustomerInfo ===');
        console.log('[Sub] AppUserId:', rcAppUserId);
        console.log('[Sub] Active entitlements:', JSON.stringify(customerInfo.entitlements?.active || {}));
        console.log('[Sub] All entitlements:', JSON.stringify(customerInfo.entitlements?.all || {}));
        console.log('[Sub] Active subscriptions:', JSON.stringify(customerInfo.activeSubscriptions || []));
        console.log('[Sub] All purchased products:', JSON.stringify(customerInfo.allPurchasedProductIdentifiers || []));

        // ================================================================
        // METHOD 1: Check entitlements.active (the proper way)
        // ================================================================
        if (customerInfo.entitlements) {
            const activeKeys = Object.keys(customerInfo.entitlements.active || {});
            const entitlement = activeKeys.length > 0 ? customerInfo.entitlements.active[activeKeys[0]] : null;

            if (entitlement) {
                proIsActive = true;
                entitlementId = activeKeys[0];
                currentSubscription = {
                    plan_id: entitlement.productIdentifier,
                    current_period_start: entitlement.latestPurchaseDate || null,
                    current_period_end: entitlement.expirationDate
                };
                trialing = entitlement.periodType === 'TRIAL';
                canceled = !!entitlement.unsubscribeDetectedAt;
                console.log('[Sub] ✅ PRO via entitlements! Trial:', trialing, 'Expires:', entitlement.expirationDate);
                return { currentSubscription, proIsActive, trialing, canceled, trialExpired, rcAppUserId, entitlementId };
            }

            // Check for expired entitlements
            const allKeys = Object.keys(customerInfo.entitlements.all || {});
            const allEntitlement = allKeys.length > 0 ? customerInfo.entitlements.all[allKeys[0]] : null;
            if (allEntitlement && !proIsActive) {
                entitlementId = allKeys[0];
                if (allEntitlement.periodType === 'TRIAL') {
                    trialExpired = true;
                }
            }
        }

        // ================================================================
        // METHOD 2: Fallback — check activeSubscriptions directly
        // This catches cases where the RevenueCat entitlement is not
        // mapped to the product, but Google Play has an active subscription.
        // ================================================================
        const activeSubs = customerInfo.activeSubscriptions || [];
        if (!proIsActive && activeSubs.length > 0) {
            proIsActive = true;
            trialExpired = false; // Override - they DO have an active sub
            currentSubscription = {
                plan_id: activeSubs[0],
                current_period_start: null,
                current_period_end: null
            };
            // We can't determine trial vs paid from activeSubscriptions alone,
            // but the user IS premium.
            console.log('[Sub] ✅ PRO via activeSubscriptions fallback! Products:', activeSubs);
        }

        // ================================================================
        // METHOD 3: Last resort — check allPurchasedProductIdentifiers
        // If there are purchased products but nothing active, the sub expired.
        // ================================================================
        if (!proIsActive) {
            const allPurchased = customerInfo.allPurchasedProductIdentifiers || [];
            if (allPurchased.length > 0) {
                console.log('[Sub] ⚠️ Has purchased products but none active:', allPurchased);
                // Don't set proIsActive - they had a sub but it's expired
            } else {
                console.log('[Sub] ❌ No entitlements, no active subs, no purchases found.');
            }
        }

        return { currentSubscription, proIsActive, trialing, canceled, trialExpired, rcAppUserId, entitlementId };
    };

    const refreshSubscription = async () => {
        try {
            // ============================================================
            // STEP 1: Ensure user is IDENTIFIED in RevenueCat first.
            // ============================================================
            if (user?.id && isNativePlatform()) {
                try {
                    console.log('[Sub] Logging into RevenueCat with userId:', user.id);
                    await loginRevenueCat(user.id);
                    console.log('[Sub] RevenueCat login complete');
                } catch (loginErr) {
                    console.error('[Sub] RevenueCat login failed:', loginErr);
                }
            }

            // ============================================================
            // STEP 2: Fetch customer info (for the now-identified user)
            // ============================================================
            const customerInfo = await Promise.race([
                getCustomerInfo(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('RevenueCat timeout')), 10000))
            ]);

            // ============================================================
            // STEP 3: Parse with bulletproof dual-check
            // ============================================================
            const parsed = parseCustomerInfo(customerInfo);

            setIsPremium(parsed.proIsActive);
            setSubscriptionData({
                subscription: parsed.currentSubscription,
                isTrialing: parsed.trialing,
                isCanceled: parsed.canceled,
                isTrialExpired: parsed.trialExpired
            });

            // ============================================================
            // STEP 4: Sync to Supabase
            // ============================================================
            if (user?.id) {
                syncToSupabase(user.id, parsed);
            }

            // ============================================================
            // STEP 5: Fetch offerings & trial eligibility
            // ============================================================
            const currentOfferings = await getOfferings();
            setOfferings(currentOfferings);

            if (currentOfferings?.current?.availablePackages?.length > 0) {
                const productIdentifiers = currentOfferings.current.availablePackages.map(pkg => pkg.product.identifier);
                const eligibility = await checkTrialEligibility(productIdentifiers);
                const isAnyEligible = Object.values(eligibility).some(res => res?.status === 2 || res?.status === 0);
                setIsTrialEligible(isAnyEligible);
            }
        } catch (error) {
            console.error('[Sub] Failed RevenueCat fetch:', error);
            setIsPremium(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            refreshSubscription();
        }
    }, [authLoading, user]);

    return {
        ...subscriptionData,
        offerings,
        isPremium,
        isTrialEligible,
        isLoading: authLoading || isLoading,
        error: null,
        refreshSubscription,
    };
}
