import { Purchases } from '@revenuecat/purchases-capacitor';
import { isNativePlatform } from './platform';

const ENTITLEMENT_ID = 'MuscleBot Pro';

export async function initRevenueCat(appUserId) {
  if (!isNativePlatform()) return;
  
  const apiKey = import.meta.env.VITE_REVENUECAT_API_KEY;
  if (!apiKey) {
    console.error('Missing VITE_REVENUECAT_API_KEY');
    return;
  }
  
  await Purchases.configure({
    apiKey,
    appUserID: appUserId || null,
  });
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
  const { offerings } = await Purchases.getOfferings();
  return offerings;
}

export async function purchasePackage(pkg) {
  if (!isNativePlatform()) return null;
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
  return customerInfo;
}

export async function checkEntitlement() {
  if (!isNativePlatform()) return true; // Free on web
  const { customerInfo } = await Purchases.getCustomerInfo();
  return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
}

export async function restorePurchases() {
  if (!isNativePlatform()) return null;
  const { customerInfo } = await Purchases.restorePurchases();
  return customerInfo;
}

export async function getCustomerInfo() {
  if (!isNativePlatform()) return null;
  const { customerInfo } = await Purchases.getCustomerInfo();
  return customerInfo;
}
