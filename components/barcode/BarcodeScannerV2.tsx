'use client';

/**
 * Next-generation barcode scanner component with full-screen camera view
 * and automatic barcode detection for both web and mobile platforms
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import * as webScanner from '@/lib/barcode-scanner/web-scanner';
import type {
  BarcodeScanResult,
  BarcodeScannerConfig,
} from '@/lib/barcode-scanner/types';

interface BarcodeScannerV2Props {
  /**
   * Whether the scanner is open
   */
  isOpen: boolean;

  /**
   * Callback when a barcode is successfully scanned
   */
  onScan: (result: BarcodeScanResult) => void;

  /**
   * Callback when the scanner is closed
   */
  onClose: () => void;

  /**
   * Optional configuration for the scanner
   */
  config?: BarcodeScannerConfig;

  /**
   * Optional title to display
   */
  title?: string;

  /**
   * Optional instructions to display
   */
  instructions?: string;
}

/**
 * Full-screen barcode scanner component with real-time detection
 */
export function BarcodeScannerV2({
  isOpen,
  onScan,
  onClose,
  config = {},
  title = 'Scan Barcode',
  instructions = 'Position the barcode within the frame',
}: BarcodeScannerV2Props) {
  const {
    startScan,
    stopScan,
    checkPermission,
    requestPermission,
    error,
    isMobile,
    isSupported,
  } = useBarcodeScanner();

  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // Generate unique ID for web scanner
  const scannerId = useRef(`barcode-scanner-${Math.random().toString(36).substring(7)}`);

  /**
   * Initialize scanner
   */
  const initializeScanner = useCallback(async () => {
    if (!isOpen || hasInitialized.current || isInitializing) {
      return;
    }

    setIsInitializing(true);
    hasInitialized.current = true;

    try {
      // Check permission
      const hasPermission = await checkPermission();

      if (!hasPermission) {
        // Request permission
        const granted = await requestPermission();
        setPermissionGranted(granted);

        if (!granted) {
          setIsInitializing(false);
          return;
        }
      } else {
        setPermissionGranted(true);
      }

      if (isMobile) {
        // Mobile: Start native scanner
        try {
          const result = await startScan(config);

          // Log the result
          console.log('Barcode scanned:', {
            value: result.value,
            format: result.format,
            timestamp: new Date(result.timestamp).toISOString(),
          });

          // Call onScan callback
          onScan(result);

          // Close scanner
          onClose();
        } catch (err) {
          console.error('Mobile scan error:', err);
        }
      } else {
        // Web: Start web scanner
        try {
          const result = await webScanner.startScan(scannerId.current, config);

          // Log the result
          console.log('Barcode scanned:', {
            value: result.value,
            format: result.format,
            timestamp: new Date(result.timestamp).toISOString(),
          });

          // Call onScan callback
          onScan(result);

          // Close scanner
          onClose();
        } catch (err) {
          console.error('Web scan error:', err);
        }
      }
    } catch (err) {
      console.error('Scanner initialization error:', err);
    } finally {
      setIsInitializing(false);
    }
  }, [
    isOpen,
    isMobile,
    config,
    checkPermission,
    requestPermission,
    startScan,
    onScan,
    onClose,
    isInitializing,
  ]);

  /**
   * Cleanup on unmount or close
   */
  const cleanup = useCallback(async () => {
    hasInitialized.current = false;
    setIsInitializing(false);

    if (!isMobile) {
      await webScanner.cleanup();
    } else {
      await stopScan();
    }
  }, [isMobile, stopScan]);

  /**
   * Handle close
   */
  const handleClose = useCallback(async () => {
    await cleanup();
    onClose();
  }, [cleanup, onClose]);

  /**
   * Initialize scanner when opened
   */
  useEffect(() => {
    if (isOpen && isSupported) {
      initializeScanner();
    }

    return () => {
      if (isOpen) {
        cleanup();
      }
    };
  }, [isOpen, isSupported, initializeScanner, cleanup]);

  /**
   * Don't render if not open
   */
  if (!isOpen) {
    return null;
  }

  /**
   * Show error if not supported
   */
  if (!isSupported) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="p-8 text-center">
          <div className="mb-4 text-red-500">
            <svg
              className="mx-auto h-16 w-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-white">
            Barcode Scanner Not Supported
          </h2>
          <p className="mb-6 text-gray-400">
            Your device or browser does not support barcode scanning.
          </p>
          <button
            onClick={handleClose}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  /**
   * Show permission denied error
   */
  if (permissionGranted === false) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="p-8 text-center">
          <div className="mb-4 text-yellow-500">
            <svg
              className="mx-auto h-16 w-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-white">Camera Permission Required</h2>
          <p className="mb-6 text-gray-400">
            Please grant camera permission to use the barcode scanner.
          </p>
          <button
            onClick={handleClose}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  /**
   * Show error message
   */
  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="p-8 text-center">
          <div className="mb-4 text-red-500">
            <svg
              className="mx-auto h-16 w-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-white">Scanner Error</h2>
          <p className="mb-6 text-gray-400">{error.message}</p>
          <button
            onClick={handleClose}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  /**
   * Render mobile scanner (full-screen overlay provided by Capacitor)
   */
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-transparent">
        {/* Header overlay */}
        <div className="relative z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <button
              onClick={handleClose}
              className="rounded-full bg-white/20 p-2 backdrop-blur-sm hover:bg-white/30"
              aria-label="Close scanner"
            >
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          {instructions && <p className="mt-2 text-sm text-white/80">{instructions}</p>}
        </div>

        {/* Camera view is provided by native plugin */}
        {/* Scanning guide overlay */}
        <div className="flex flex-1 items-center justify-center">
          <div className="relative">
            <div className="h-64 w-64 rounded-2xl border-4 border-white/50 shadow-2xl" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-1 w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-75 animate-scan" />
            </div>
          </div>
        </div>

        {/* Footer overlay */}
        <div className="relative z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
          <p className="text-center text-sm text-white/80">
            {isInitializing ? 'Initializing camera...' : 'Scanning for barcodes...'}
          </p>
        </div>
      </div>
    );
  }

  /**
   * Render web scanner (html5-qrcode)
   */
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="relative z-10 bg-gradient-to-b from-black to-transparent p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button
            onClick={handleClose}
            className="rounded-full bg-white/20 p-2 backdrop-blur-sm hover:bg-white/30"
            aria-label="Close scanner"
          >
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {instructions && <p className="mt-2 text-sm text-white/80">{instructions}</p>}
      </div>

      {/* Scanner container */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          {/* html5-qrcode container */}
          <div
            id={scannerId.current}
            ref={scannerRef}
            className="overflow-hidden rounded-2xl shadow-2xl"
          />

          {isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="text-center">
                <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
                <p className="text-white">Initializing camera...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 bg-gradient-to-t from-black to-transparent p-4">
        <p className="text-center text-sm text-white/80">
          Position the barcode within the scanning area
        </p>
      </div>
    </div>
  );
}

export default BarcodeScannerV2;
