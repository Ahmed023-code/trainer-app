/**
 * Unified barcode scanner hook for web and mobile platforms
 */

import { useState, useCallback, useEffect } from 'react';
import { isNativePlatform } from '@/lib/platform';
import type {
  BarcodeScanResult,
  BarcodeScannerConfig,
  BarcodeScannerError,
  BarcodeScannerHook,
} from '@/lib/barcode-scanner/types';

interface UseBarcodeScanner extends BarcodeScannerHook {
  /**
   * Whether the device is a native mobile platform
   */
  isMobile: boolean;

  /**
   * Whether the scanner is supported on this platform
   */
  isSupported: boolean;
}

/**
 * Hook for barcode scanning that automatically uses the appropriate
 * implementation based on the platform (web or native mobile)
 */
export function useBarcodeScanner(): UseBarcodeScanner {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<BarcodeScannerError | null>(null);
  const [isMobile] = useState(() => isNativePlatform());
  const [isSupported, setIsSupported] = useState(true);

  // Check if scanner is supported on mount
  useEffect(() => {
    const checkSupport = async () => {
      if (isMobile) {
        try {
          // Dynamically import mobile scanner only on native platforms
          const mobileScanner = await import(
            /* webpackIgnore: true */
            '@/lib/barcode-scanner/mobile-scanner'
          );
          const supported = await mobileScanner.isSupported();
          setIsSupported(supported);
        } catch (err) {
          console.error('Failed to load mobile scanner:', err);
          setIsSupported(false);
        }
      } else {
        // Web is always supported if getUserMedia is available
        const supported =
          typeof navigator !== 'undefined' &&
          !!navigator.mediaDevices &&
          !!navigator.mediaDevices.getUserMedia;
        setIsSupported(supported);
      }
    };

    checkSupport();
  }, [isMobile]);

  /**
   * Check camera permission
   */
  const checkPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (isMobile) {
        const mobileScanner = await import(
          /* webpackIgnore: true */
          '@/lib/barcode-scanner/mobile-scanner'
        );
        return await mobileScanner.checkPermission();
      } else {
        const webScanner = await import('@/lib/barcode-scanner/web-scanner');
        return await webScanner.checkPermission();
      }
    } catch (err) {
      console.error('Error checking permission:', err);
      return false;
    }
  }, [isMobile]);

  /**
   * Request camera permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (isMobile) {
        const mobileScanner = await import(
          /* webpackIgnore: true */
          '@/lib/barcode-scanner/mobile-scanner'
        );
        return await mobileScanner.requestPermission();
      } else {
        const webScanner = await import('@/lib/barcode-scanner/web-scanner');
        return await webScanner.requestPermission();
      }
    } catch (err) {
      console.error('Error requesting permission:', err);
      return false;
    }
  }, [isMobile]);

  /**
   * Start scanning (this is used internally by the component)
   */
  const startScan = useCallback(
    async (config?: BarcodeScannerConfig): Promise<BarcodeScanResult> => {
      setError(null);
      setIsScanning(true);

      try {
        if (isMobile) {
          // Mobile: Use Capacitor ML Kit
          const mobileScanner = await import(
            /* webpackIgnore: true */
            '@/lib/barcode-scanner/mobile-scanner'
          );
          const result = await mobileScanner.startScan(config);
          setIsScanning(false);
          return result;
        } else {
          // Web: This should not be called directly for web
          // Web scanner is controlled by the component
          throw new Error('Web scanner should be controlled by the component');
        }
      } catch (err) {
        setIsScanning(false);
        const scanError = err as BarcodeScannerError;
        setError(scanError);
        throw scanError;
      }
    },
    [isMobile]
  );

  /**
   * Stop scanning
   */
  const stopScan = useCallback(async (): Promise<void> => {
    try {
      if (isMobile) {
        const mobileScanner = await import(
          /* webpackIgnore: true */
          '@/lib/barcode-scanner/mobile-scanner'
        );
        await mobileScanner.stopScan();
      } else {
        const webScanner = await import('@/lib/barcode-scanner/web-scanner');
        await webScanner.stopScan();
      }
      setIsScanning(false);
      setError(null);
    } catch (err) {
      console.error('Error stopping scan:', err);
    }
  }, [isMobile]);

  return {
    startScan,
    stopScan,
    checkPermission,
    requestPermission,
    isScanning,
    error,
    isMobile,
    isSupported,
  };
}

export default useBarcodeScanner;
