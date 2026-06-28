import { Purchases } from '@revenuecat/purchases-capacitor';
import { isNativePlatform } from './platform';

const ENTITLEMENT_ID = 'MuscleBot Pro';

let isInitialized = false;
let initPromise = null;

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
      return;
    }
    
    
    
    const config = { apiKey };
    if (appUserId) config.appUserID = appUserId;
    
    await Purchases.configure(config);
    isInitialized = true;
  })();
  
  return initPromise;
}

export async function loginRevenueCat(userId) {
  if (!isNativePlatform()) return;
  await Purchases.logIn({ appUserID: userId });
}

export async function logoutRevenueCat() {
  if (!isNativePlatform()) return;
  await Purchases.logOut();
}

export async function getOfferings() {
  if (!isNativePlatform()) return null;
  await ensureInitialized();
  
  try {
      const offerings = await Purchases.getOfferings();
      return offerings;
  } catch (error) {
      console.error("Purchases.getOfferings failed:", error);
      throw error;
  }
}

export async function purchasePackage(pkg) {
  if (!isNativePlatform()) return null;
  await ensureInitialized();
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
  return customerInfo;
}

export async function checkEntitlement() {
  if (!isNativePlatform()) return true; // Free on web
  await ensureInitialized();
  const { customerInfo } = await Purchases.getCustomerInfo();
  return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
}

export async function restorePurchases() {
  if (!isNativePlatform()) return null;
  await ensureInitialized();
  const { customerInfo } = await Purchases.restorePurchases();
  return customerInfo;
}

export async function getCustomerInfo() {
  if (!isNativePlatform()) return null;
  await ensureInitialized();
  const { customerInfo } = await Purchases.getCustomerInfo();
  return customerInfo;
}
