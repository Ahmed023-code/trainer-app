/**
 * Mobile barcode scanner implementation using Capacitor ML Kit
 */

import { BarcodeScanner, BarcodeFormat as MLKitFormat } from '@capacitor-mlkit/barcode-scanning';
import type {
  BarcodeScanResult,
  BarcodeScannerConfig,
  BarcodeScannerError,
  BarcodeFormat,
} from './types';

/**
 * Map ML Kit barcode format to our standard format
 */
function mapBarcodeFormat(mlkitFormat: MLKitFormat): BarcodeFormat {
  const formatMap: Record<MLKitFormat, BarcodeFormat> = {
    [MLKitFormat.Aztec]: 'AZTEC',
    [MLKitFormat.Codabar]: 'CODABAR',
    [MLKitFormat.Code39]: 'CODE_39',
    [MLKitFormat.Code93]: 'CODE_93',
    [MLKitFormat.Code128]: 'CODE_128',
    [MLKitFormat.DataMatrix]: 'DATA_MATRIX',
    [MLKitFormat.Ean8]: 'EAN_8',
    [MLKitFormat.Ean13]: 'EAN_13',
    [MLKitFormat.Itf]: 'ITF',
    [MLKitFormat.Pdf417]: 'PDF_417',
    [MLKitFormat.QrCode]: 'QR_CODE',
    [MLKitFormat.UpcA]: 'UPC_A',
    [MLKitFormat.UpcE]: 'UPC_E',
    [MLKitFormat.Unknown]: 'UNKNOWN',
  };

  return formatMap[mlkitFormat] || 'UNKNOWN';
}

/**
 * Map our standard format to ML Kit format
 */
function mapToMLKitFormat(format: BarcodeFormat): MLKitFormat | undefined {
  const formatMap: Record<BarcodeFormat, MLKitFormat> = {
    AZTEC: MLKitFormat.Aztec,
    CODABAR: MLKitFormat.Codabar,
    CODE_39: MLKitFormat.Code39,
    CODE_93: MLKitFormat.Code93,
    CODE_128: MLKitFormat.Code128,
    DATA_MATRIX: MLKitFormat.DataMatrix,
    EAN_8: MLKitFormat.Ean8,
    EAN_13: MLKitFormat.Ean13,
    ITF: MLKitFormat.Itf,
    PDF_417: MLKitFormat.Pdf417,
    QR_CODE: MLKitFormat.QrCode,
    UPC_A: MLKitFormat.UpcA,
    UPC_E: MLKitFormat.UpcE,
    UNKNOWN: MLKitFormat.Unknown,
  };

  return formatMap[format];
}

/**
 * Check camera permission status
 */
export async function checkPermission(): Promise<boolean> {
  try {
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
    const formats = config.formats?.map(mapToMLKitFormat).filter(Boolean) as MLKitFormat[];

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
    await BarcodeScanner.installGoogleBarcodeScannerModule();
  } catch (error) {
    console.error('Error installing Google Barcode Scanner module:', error);
    throw error;
  }
}
