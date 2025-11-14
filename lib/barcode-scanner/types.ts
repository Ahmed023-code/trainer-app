/**
 * Barcode scanner types and interfaces
 */

export type BarcodeFormat =
  | 'UPC_A'
  | 'UPC_E'
  | 'EAN_8'
  | 'EAN_13'
  | 'CODE_39'
  | 'CODE_93'
  | 'CODE_128'
  | 'QR_CODE'
  | 'DATA_MATRIX'
  | 'PDF_417'
  | 'AZTEC'
  | 'ITF'
  | 'CODABAR'
  | 'UNKNOWN';

export interface BarcodeScanResult {
  /**
   * The detected barcode value (text)
   */
  value: string;

  /**
   * The format/type of the barcode
   */
  format: BarcodeFormat;

  /**
   * Timestamp when the barcode was detected
   */
  timestamp: number;
}

export interface BarcodeScannerConfig {
  /**
   * Formats to detect (if not specified, all formats will be detected)
   */
  formats?: BarcodeFormat[];

  /**
   * Whether to play a sound when a barcode is detected
   */
  sound?: boolean;

  /**
   * Whether to vibrate when a barcode is detected
   */
  vibrate?: boolean;

  /**
   * Camera to use ('front' or 'back')
   */
  camera?: 'front' | 'back';

  /**
   * Whether to show a scanning guide/frame
   */
  showGuide?: boolean;
}

export interface BarcodeScannerError {
  /**
   * Error code
   */
  code: 'PERMISSION_DENIED' | 'CAMERA_UNAVAILABLE' | 'SCAN_CANCELLED' | 'UNKNOWN_ERROR';

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Original error object
   */
  originalError?: unknown;
}

export interface BarcodeScannerHook {
  /**
   * Start scanning for barcodes
   */
  startScan: (config?: BarcodeScannerConfig) => Promise<BarcodeScanResult>;

  /**
   * Stop the current scan
   */
  stopScan: () => Promise<void>;

  /**
   * Check if camera permission is granted
   */
  checkPermission: () => Promise<boolean>;

  /**
   * Request camera permission
   */
  requestPermission: () => Promise<boolean>;

  /**
   * Whether scanner is currently active
   */
  isScanning: boolean;

  /**
   * Current error, if any
   */
  error: BarcodeScannerError | null;
}
