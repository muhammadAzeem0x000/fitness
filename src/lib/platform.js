import { Capacitor } from '@capacitor/core';

/**
 * Checks if the application is currently running as a native mobile app (iOS or Android)
 * via Capacitor.
 * @returns {boolean} true if native, false if running in a web browser
 */
export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Gets the current platform name (e.g., 'web', 'ios', 'android')
 * @returns {string} Platform name
 */
export const getPlatform = () => {
  return Capacitor.getPlatform();
};
