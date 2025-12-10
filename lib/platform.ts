/**
 * Platform detection utility for cross-platform functionality
 */

import { Capacitor } from '@capacitor/core';

export type Platform = 'web' | 'ios' | 'android';

/**
 * Get the current platform
 */
export function getPlatform(): Platform {
  const platform = Capacitor.getPlatform();

  if (platform === 'ios') return 'ios';
  if (platform === 'android') return 'android';
  return 'web';
}

/**
 * Check if running on a native mobile platform (iOS or Android)
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Check if running on web
 */
export function isWeb(): boolean {
  return getPlatform() === 'web';
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return getPlatform() === 'ios';
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return getPlatform() === 'android';
}
