/**
 * Mobile barcode scanner implementation using Capacitor ML Kit
 *
 * Note: This module should only be imported on native platforms.
 * Use dynamic imports to prevent bundling in web builds.
 */

import type {
  BarcodeScanResult,
  BarcodeScannerConfig,
  BarcodeScannerError,
  BarcodeFormat,
} from './types';

// Dynamic import types for Capacitor ML Kit
type BarcodeScanner = typeof import('@capacitor-mlkit/barcode-scanning').BarcodeScanner;
type MLKitFormat = typeof import('@capacitor-mlkit/barcode-scanning').BarcodeFormat;

// Lazy load the Capacitor plugin
let BarcodeScannerPlugin: BarcodeScanner | null = null;
let BarcodeFormatEnum: any = null;

async function loadPlugin() {
  if (!BarcodeScannerPlugin) {
    const module = await import('@capacitor-mlkit/barcode-scanning');
    BarcodeScannerPlugin = module.BarcodeScanner;
    BarcodeFormatEnum = module.BarcodeFormat;
  }
  return { BarcodeScanner: BarcodeScannerPlugin!, BarcodeFormat: BarcodeFormatEnum! };
}

/**
 * Map ML Kit barcode format to our standard format
 */
function mapBarcodeFormat(mlkitFormat: number): BarcodeFormat {
  // Map numeric format values to string format names
  const formatMap: Record<number, BarcodeFormat> = {
    0: 'UNKNOWN',
    1: 'CODE_128',
    2: 'CODE_39',
    4: 'CODE_93',
    8: 'CODABAR',
    16: 'DATA_MATRIX',
    32: 'EAN_13',
    64: 'EAN_8',
    128: 'ITF',
    256: 'QR_CODE',
    512: 'UPC_A',
    1024: 'UPC_E',
    2048: 'PDF_417',
    4096: 'AZTEC',
  };

  return formatMap[mlkitFormat] || 'UNKNOWN';
}

/**
 * Map our standard format to ML Kit format
 */
function mapToMLKitFormat(format: BarcodeFormat, BarcodeFormat: any): number | undefined {
  const formatMap: Record<BarcodeFormat, string> = {
    AZTEC: 'Aztec',
    CODABAR: 'Codabar',
    CODE_39: 'Code39',
    CODE_93: 'Code93',
    CODE_128: 'Code128',
    DATA_MATRIX: 'DataMatrix',
    EAN_8: 'Ean8',
    EAN_13: 'Ean13',
    ITF: 'Itf',
    PDF_417: 'Pdf417',
    QR_CODE: 'QrCode',
    UPC_A: 'UpcA',
    UPC_E: 'UpcE',
    UNKNOWN: 'Unknown',
  };

  const formatName = formatMap[format];
  return formatName ? BarcodeFormat[formatName] : undefined;
}

/**
 * Check camera permission status
 */
export async function checkPermission(): Promise<boolean> {
  try {
    const { BarcodeScanner } = await loadPlugin();
    const { camera } = await BarcodeScanner.checkPermissions();
    return camera === 'granted' || camera === 'limited';
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return false;
  }
}

/**
 * Request camera permission
 */
export async function requestPermission(): Promise<boolean> {
  try {
    const { BarcodeScanner } = await loadPlugin();
    const { camera } = await BarcodeScanner.requestPermissions();
    return camera === 'granted' || camera === 'limited';
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
}

/**
 * Start scanning for barcodes
 */
export async function startScan(
  config: BarcodeScannerConfig = {}
): Promise<BarcodeScanResult> {
  try {
    const { BarcodeScanner, BarcodeFormat } = await loadPlugin();

    // Check and request permission
    const hasPermission = await checkPermission();
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        const error: BarcodeScannerError = {
          code: 'PERMISSION_DENIED',
          message: 'Camera permission was denied',
        };
        throw error;
      }
    }

    // Prepare formats if specified
    const formats = config.formats?.map(f => mapToMLKitFormat(f, BarcodeFormat)).filter(Boolean) as number[];

    // Add listener for barcode detection
    const scanPromise = new Promise<BarcodeScanResult>((resolve, reject) => {
      const listener = BarcodeScanner.addListener('barcodeScanned', async (result) => {
        if (result.barcode) {
          // Stop scanning
          await BarcodeScanner.stopScan();

          // Remove listener
          listener.remove();

          // Hide background
          document.body.classList.remove('barcode-scanner-active');

          // Resolve with result
          resolve({
            value: result.barcode.displayValue || result.barcode.rawValue || '',
            format: mapBarcodeFormat(result.barcode.format),
            timestamp: Date.now(),
          });
        }
      });

      // Start scanning
      BarcodeScanner.startScan({
        formats: formats.length > 0 ? formats : undefined,
      }).catch((error) => {
        listener.remove();
        document.body.classList.remove('barcode-scanner-active');
        reject(error);
      });
    });

    // Make background transparent for camera view
    document.body.classList.add('barcode-scanner-active');

    return await scanPromise;
  } catch (error: unknown) {
    const scanError: BarcodeScannerError = {
      code: 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : 'Failed to scan barcode',
      originalError: error,
    };
    throw scanError;
  }
}

/**
 * Stop the current scan
 */
export async function stopScan(): Promise<void> {
  try {
    const { BarcodeScanner } = await loadPlugin();
    await BarcodeScanner.stopScan();
    document.body.classList.remove('barcode-scanner-active');
  } catch (error) {
    console.error('Error stopping scan:', error);
  }
}

/**
 * Check if scanner is supported on this device
 */
export async function isSupported(): Promise<boolean> {
  try {
    const { BarcodeScanner } = await loadPlugin();
    const { supported } = await BarcodeScanner.isSupported();
    return supported;
  } catch (error) {
    console.error('Error checking scanner support:', error);
    return false;
  }
}

/**
 * Install Google Barcode Scanner module (if not already installed)
 * This is required on some Android devices
 */
export async function installGoogleBarcodeScannerModule(): Promise<void> {
  try {
    const { BarcodeScanner } = await loadPlugin();
    await BarcodeScanner.installGoogleBarcodeScannerModule();
  } catch (error) {
    console.error('Error installing Google Barcode Scanner module:', error);
    throw error;
  }
}
