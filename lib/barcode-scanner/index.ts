/**
 * Barcode Scanner Module
 *
 * Export all barcode scanner related functionality
 */

// Types
export * from './types';

// Platform-specific implementations
export * as mobileScanner from './mobile-scanner';
export * as webScanner from './web-scanner';

// React hook
export { useBarcodeScanner, default as useBarcodeScannerHook } from '@/hooks/useBarcodeScanner';

// Component
export { BarcodeScannerV2, default as BarcodeScanner } from '@/components/barcode/BarcodeScannerV2';
