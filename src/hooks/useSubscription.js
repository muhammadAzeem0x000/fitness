import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getOfferings, checkTrialEligibility, getCustomerInfo } from '../lib/revenuecat';

/**
 * Hook to manage user subscription status
 * Returns subscription data and premium status
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

    const refreshSubscription = async () => {
        try {
            // Race the customer info check against a 5-second timeout
            const customerInfo = await Promise.race([
                getCustomerInfo(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('RevenueCat timeout')), 5000))
            ]);
            
            let currentSubscription = null;
            let proIsActive = false;
            let trialing = false;
            let canceled = false;
            let trialExpired = false;

            if (customerInfo && customerInfo.entitlements) {
                const entitlement = customerInfo.entitlements.active['MuscleBot Pro'];
                const allEntitlement = customerInfo.entitlements.all['MuscleBot Pro'];

                if (entitlement) {
                    proIsActive = true;
                    currentSubscription = {
                        plan_id: entitlement.productIdentifier,
                        current_period_end: entitlement.expirationDate
                    };
                    trialing = entitlement.periodType === 'TRIAL';
                    canceled = !!entitlement.unsubscribeDetectedAt;
                } else if (allEntitlement) {
                    // Not active, but had one in the past
                    if (allEntitlement.periodType === 'TRIAL') {
                        trialExpired = true;
                    }
                    currentSubscription = {
                        plan_id: allEntitlement.productIdentifier,
                        current_period_end: allEntitlement.expirationDate
                    };
                }
            }
            
            setIsPremium(proIsActive);
            setSubscriptionData({
                subscription: currentSubscription,
                isTrialing: trialing,
                isCanceled: canceled,
                isTrialExpired: trialExpired
            });

            // In parallel (or sequentially after), fetch offerings & trial status
            const currentOfferings = await getOfferings();
            setOfferings(currentOfferings);

            if (currentOfferings?.current?.availablePackages?.length > 0) {
                const productIdentifiers = currentOfferings.current.availablePackages.map(pkg => pkg.product.identifier);
                const eligibility = await checkTrialEligibility(productIdentifiers);
                
                // Check if any package is eligible (2 = ELIGIBLE, 0 = UNKNOWN which often happens on Android Sandbox)
                const isAnyEligible = Object.values(eligibility).some(res => res?.status === 2 || res?.status === 0);
                setIsTrialEligible(isAnyEligible);
            }
        } catch (error) {
            console.error('Failed RevenueCat fetch', error);
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
