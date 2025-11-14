/**
 * Web barcode scanner implementation using html5-qrcode
 */

import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import type {
  BarcodeScanResult,
  BarcodeScannerConfig,
  BarcodeScannerError,
  BarcodeFormat,
} from './types';

let scannerInstance: Html5Qrcode | null = null;
let isScanning = false;

/**
 * Map html5-qrcode format to our standard format
 */
function mapBarcodeFormat(html5Format: number): BarcodeFormat {
  // html5-qrcode uses Html5QrcodeSupportedFormats enum
  const formatMap: Record<number, BarcodeFormat> = {
    [Html5QrcodeSupportedFormats.QR_CODE]: 'QR_CODE',
    [Html5QrcodeSupportedFormats.AZTEC]: 'AZTEC',
    [Html5QrcodeSupportedFormats.CODABAR]: 'CODABAR',
    [Html5QrcodeSupportedFormats.CODE_39]: 'CODE_39',
    [Html5QrcodeSupportedFormats.CODE_93]: 'CODE_93',
    [Html5QrcodeSupportedFormats.CODE_128]: 'CODE_128',
    [Html5QrcodeSupportedFormats.DATA_MATRIX]: 'DATA_MATRIX',
    [Html5QrcodeSupportedFormats.EAN_8]: 'EAN_8',
    [Html5QrcodeSupportedFormats.EAN_13]: 'EAN_13',
    [Html5QrcodeSupportedFormats.ITF]: 'ITF',
    [Html5QrcodeSupportedFormats.PDF_417]: 'PDF_417',
    [Html5QrcodeSupportedFormats.UPC_A]: 'UPC_A',
    [Html5QrcodeSupportedFormats.UPC_E]: 'UPC_E',
  };

  return formatMap[html5Format] || 'UNKNOWN';
}

/**
 * Map our standard format to html5-qrcode format
 */
function mapToHtml5Format(format: BarcodeFormat): Html5QrcodeSupportedFormats | undefined {
  const formatMap: Record<BarcodeFormat, Html5QrcodeSupportedFormats> = {
    QR_CODE: Html5QrcodeSupportedFormats.QR_CODE,
    AZTEC: Html5QrcodeSupportedFormats.AZTEC,
    CODABAR: Html5QrcodeSupportedFormats.CODABAR,
    CODE_39: Html5QrcodeSupportedFormats.CODE_39,
    CODE_93: Html5QrcodeSupportedFormats.CODE_93,
    CODE_128: Html5QrcodeSupportedFormats.CODE_128,
    DATA_MATRIX: Html5QrcodeSupportedFormats.DATA_MATRIX,
    EAN_8: Html5QrcodeSupportedFormats.EAN_8,
    EAN_13: Html5QrcodeSupportedFormats.EAN_13,
    ITF: Html5QrcodeSupportedFormats.ITF,
    PDF_417: Html5QrcodeSupportedFormats.PDF_417,
    UPC_A: Html5QrcodeSupportedFormats.UPC_A,
    UPC_E: Html5QrcodeSupportedFormats.UPC_E,
    UNKNOWN: Html5QrcodeSupportedFormats.QR_CODE, // Default fallback
  };

  return formatMap[format];
}

/**
 * Check camera permission status
 */
export async function checkPermission(): Promise<boolean> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }

    // Try to enumerate devices to check permission
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasCamera = devices.some((device) => device.kind === 'videoinput');

    return hasCamera;
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
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }

    // Request camera access
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });

    // Stop the stream immediately - we just wanted to check permission
    stream.getTracks().forEach((track) => track.stop());

    return true;
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
}

/**
 * Start scanning for barcodes
 */
export async function startScan(
  elementId: string,
  config: BarcodeScannerConfig = {}
): Promise<BarcodeScanResult> {
  try {
    // Check permission first
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

    // Initialize scanner if not already done
    if (!scannerInstance) {
      scannerInstance = new Html5Qrcode(elementId);
    }

    // Stop existing scan if running
    if (isScanning) {
      await stopScan();
    }

    // Prepare formats
    const formats = config.formats
      ? config.formats.map(mapToHtml5Format).filter(Boolean) as Html5QrcodeSupportedFormats[]
      : [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
        ];

    // Create a promise that resolves when a barcode is detected
    return new Promise<BarcodeScanResult>((resolve, reject) => {
      const scanSuccess = (decodedText: string, result: any) => {
        isScanning = false;

        // Stop scanning
        stopScan().then(() => {
          resolve({
            value: decodedText,
            format: result.result?.format?.format
              ? mapBarcodeFormat(result.result.format.format)
              : 'UNKNOWN',
            timestamp: Date.now(),
          });
        });
      };

      const scanError = (errorMessage: string) => {
        // This is called continuously while scanning, so we don't reject on every error
        // Only log in development mode
        if (process.env.NODE_ENV === 'development') {
          console.debug('Scan error:', errorMessage);
        }
      };

      // Start scanning
      scannerInstance!
        .start(
          { facingMode: config.camera === 'front' ? 'user' : 'environment' },
          {
            fps: 10, // Scans per second
            qrbox: config.showGuide !== false ? { width: 250, height: 250 } : undefined,
            formatsToSupport: formats,
            aspectRatio: 1.0,
          },
          scanSuccess,
          scanError
        )
        .then(() => {
          isScanning = true;
        })
        .catch((error) => {
          const scanError: BarcodeScannerError = {
            code: 'CAMERA_UNAVAILABLE',
            message: error instanceof Error ? error.message : 'Failed to start camera',
            originalError: error,
          };
          reject(scanError);
        });
    });
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
    if (scannerInstance && isScanning) {
      await scannerInstance.stop();
      isScanning = false;
    }
  } catch (error) {
    console.error('Error stopping scan:', error);
  }
}

/**
 * Clean up scanner instance
 */
export async function cleanup(): Promise<void> {
  try {
    if (scannerInstance) {
      if (isScanning) {
        await scannerInstance.stop();
      }
      await scannerInstance.clear();
      scannerInstance = null;
      isScanning = false;
    }
  } catch (error) {
    console.error('Error cleaning up scanner:', error);
  }
}

/**
 * Check if scanner is currently active
 */
export function getIsScanning(): boolean {
  return isScanning;
}
