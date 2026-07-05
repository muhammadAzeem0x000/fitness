import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { loginRevenueCat, getOfferings, checkTrialEligibility, getCustomerInfo, isRevenueCatLoggedIn } from '../lib/revenuecat';
import { isNativePlatform } from '../lib/platform';
import { supabase } from '../lib/supabase';

/**
 * Hook to manage user subscription status.
 * 
 * CRITICAL FLOW:
 * 1. Wait for auth to resolve (get Supabase user ID)
 * 2. Log in to RevenueCat with Supabase user ID (MUST complete before step 3)
 * 3. Fetch customerInfo from RevenueCat (now returns identified user's entitlements)
 * 4. Sync the result to Supabase subscriptions table
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

    const refreshSubscription = async () => {
        try {
            // ============================================================
            // STEP 1: Ensure user is IDENTIFIED in RevenueCat first.
            // This MUST complete before getCustomerInfo() is called,
            // otherwise we get the anonymous user's (empty) entitlements.
            // ============================================================
            if (user?.id && isNativePlatform()) {
                try {
                    await loginRevenueCat(user.id);
                } catch (loginErr) {
                    console.error('[Sub] RevenueCat login failed, continuing with current state:', loginErr);
                }
            }

            // ============================================================
            // STEP 2: Now fetch customer info (for the identified user)
            // ============================================================
            const customerInfo = await Promise.race([
                getCustomerInfo(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('RevenueCat timeout')), 8000))
            ]);
            
            let currentSubscription = null;
            let proIsActive = false;
            let trialing = false;
            let canceled = false;
            let trialExpired = false;
            let rcAppUserId = null;
            let entitlementId = null;

            if (customerInfo) {
                rcAppUserId = customerInfo.originalAppUserId || null;
                console.log('[Sub] CustomerInfo received. AppUserId:', rcAppUserId);
                console.log('[Sub] Active entitlements:', JSON.stringify(customerInfo.entitlements.active));
                console.log('[Sub] All entitlements:', JSON.stringify(customerInfo.entitlements.all));
            }

            if (customerInfo && customerInfo.entitlements) {
                // Dynamically get the first active entitlement
                const activeKeys = Object.keys(customerInfo.entitlements.active);
                const entitlement = activeKeys.length > 0 ? customerInfo.entitlements.active[activeKeys[0]] : null;
                
                const allKeys = Object.keys(customerInfo.entitlements.all);
                const allEntitlement = allKeys.length > 0 ? customerInfo.entitlements.all[allKeys[0]] : null;

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
                    console.log('[Sub] PRO ACTIVE! Trial:', trialing, 'Expires:', entitlement.expirationDate);
                } else if (allEntitlement) {
                    entitlementId = allKeys[0];
                    if (allEntitlement.periodType === 'TRIAL') {
                        trialExpired = true;
                    }
                    currentSubscription = {
                        plan_id: allEntitlement.productIdentifier,
                        current_period_start: allEntitlement.latestPurchaseDate || null,
                        current_period_end: allEntitlement.expirationDate
                    };
                    console.log('[Sub] Past entitlement found but not active. Expired:', trialExpired);
                } else {
                    console.log('[Sub] No entitlements found for this user.');
                }
            }
            
            setIsPremium(proIsActive);
            setSubscriptionData({
                subscription: currentSubscription,
                isTrialing: trialing,
                isCanceled: canceled,
                isTrialExpired: trialExpired
            });

            // Sync to Supabase in the background
            if (user?.id) {
                syncToSupabase(user.id, {
                    proIsActive, trialing, canceled, trialExpired,
                    currentSubscription, rcAppUserId, entitlementId
                });
            }

            // Fetch offerings & trial eligibility
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
