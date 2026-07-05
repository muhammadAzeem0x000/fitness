import { Purchases } from '@revenuecat/purchases-capacitor';
import { isNativePlatform } from './platform';

let isInitialized = false;
let initPromise = null;
let isLoggedIn = false;

async function ensureInitialized() {
  if (!isNativePlatform()) return;
  if (isInitialized) return;
  if (initPromise) {
    await initPromise;
    return;
  }
  return initRevenueCat(null);
}

export async function initRevenueCat(appUserId) {
  if (!isNativePlatform()) return;
  
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const apiKey = import.meta.env.VITE_REVENUECAT_API_KEY;
    if (!apiKey) {
      console.error('Missing VITE_REVENUECAT_API_KEY');
      throw new Error('Missing VITE_REVENUECAT_API_KEY');
    }
    
    const config = { apiKey };
    if (appUserId) config.appUserID = appUserId;
    
    await Purchases.configure(config);
    isInitialized = true;
    console.log('[RC] SDK configured', appUserId ? `with user: ${appUserId}` : 'anonymously');
  })();
  
  return initPromise;
}

/**
 * Log in to RevenueCat with the Supabase user ID.
 * This MUST be awaited before calling getCustomerInfo() to ensure
 * entitlements are returned for the correct user.
 */
export async function loginRevenueCat(userId) {
  if (!isNativePlatform()) return null;
  await ensureInitialized();
  try {
    const { customerInfo } = await Purchases.logIn({ appUserID: userId });
    isLoggedIn = true;
    console.log('[RC] Logged in as:', userId, 'Active entitlements:', Object.keys(customerInfo.entitlements.active));
    return customerInfo;
  } catch (error) {
    console.error('[RC] Login failed:', error);
    throw error;
  }
}

export async function logoutRevenueCat() {
  if (!isNativePlatform()) return;
  await ensureInitialized();
  await Purchases.logOut();
  isLoggedIn = false;
  console.log('[RC] Logged out');
}

export function isRevenueCatLoggedIn() {
  return isLoggedIn;
}

export async function getOfferings() {
  if (!isNativePlatform()) return null;
  await ensureInitialized();
  
  try {
      const offerings = await Purchases.getOfferings();
      return offerings;
  } catch (error) {
      console.error("[RC] Purchases.getOfferings failed:", error);
      throw error;
  }
}

export async function purchasePackage(pkg) {
  if (!isNativePlatform()) return null;
  await ensureInitialized();
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
  console.log('[RC] Purchase completed. Active entitlements:', Object.keys(customerInfo.entitlements.active));
  return customerInfo;
}

export async function checkEntitlement() {
  if (!isNativePlatform()) return true; // Free on web
  await ensureInitialized();
  const { customerInfo } = await Purchases.getCustomerInfo();
  // Dual check: entitlements OR activeSubscriptions
  const hasEntitlement = Object.keys(customerInfo.entitlements?.active || {}).length > 0;
  const hasActiveSub = (customerInfo.activeSubscriptions || []).length > 0;
  return hasEntitlement || hasActiveSub;
}

export async function restorePurchases() {
  if (!isNativePlatform()) return null;
  await ensureInitialized();
  const { customerInfo } = await Purchases.restorePurchases();
  console.log('[RC] Restore completed. Active entitlements:', Object.keys(customerInfo.entitlements.active));
  return customerInfo;
}

export async function getCustomerInfo() {
  if (!isNativePlatform()) return null;
  await ensureInitialized();
  const { customerInfo } = await Purchases.getCustomerInfo();
  return customerInfo;
}

export async function checkTrialEligibility(productIdentifiers) {
  if (!isNativePlatform()) return {};
  await ensureInitialized();
  try {
    const eligibilityMap = await Purchases.checkTrialOrIntroductoryPriceEligibility({ productIdentifiers });
    return eligibilityMap;
  } catch (error) {
    console.error("[RC] Trial check failed:", error);
    return {};
  }
}
