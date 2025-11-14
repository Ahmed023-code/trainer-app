# Barcode Scanner V2

A production-ready barcode scanner component with full-screen camera view and automatic barcode detection for both web and mobile platforms.

## Features

- **Full-screen camera view** - Shows exactly what the camera sees while scanning
- **Real-time automatic detection** - No button press needed, detects barcodes automatically
- **Cross-platform support** - Works on web (desktop/mobile browsers) and native mobile (iOS/Android via Capacitor)
- **Multiple barcode formats** - Supports UPC, EAN, QR codes, Code 128, Code 39, and more
- **Proper error handling** - Handles camera permissions, errors, and edge cases gracefully
- **TypeScript support** - Fully typed with TypeScript
- **Modern React** - Built with React hooks and modern best practices

## Installation

The required dependencies are already installed:

```bash
npm install html5-qrcode @capacitor-mlkit/barcode-scanning
```

## Usage

### Basic Usage

```tsx
import { BarcodeScannerV2 } from '@/components/barcode/BarcodeScannerV2';
import type { BarcodeScanResult } from '@/lib/barcode-scanner/types';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  const handleScan = (result: BarcodeScanResult) => {
    console.log('Scanned:', result.value);
    console.log('Format:', result.format);
    console.log('Timestamp:', result.timestamp);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Scan Barcode
      </button>

      <BarcodeScannerV2
        isOpen={isOpen}
        onScan={handleScan}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
```

### With Configuration

```tsx
<BarcodeScannerV2
  isOpen={isOpen}
  onScan={handleScan}
  onClose={() => setIsOpen(false)}
  title="Scan Product Barcode"
  instructions="Align the barcode within the frame"
  config={{
    formats: ['UPC_A', 'UPC_E', 'EAN_13', 'QR_CODE'],
    camera: 'back',
    showGuide: true,
  }}
/>
```

### Using the Hook

```tsx
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';

function MyComponent() {
  const {
    checkPermission,
    requestPermission,
    isScanning,
    error,
    isMobile,
    isSupported,
  } = useBarcodeScanner();

  const handleCheckPermission = async () => {
    const hasPermission = await checkPermission();
    if (!hasPermission) {
      await requestPermission();
    }
  };

  return (
    <div>
      <p>Platform: {isMobile ? 'Mobile' : 'Web'}</p>
      <p>Supported: {isSupported ? 'Yes' : 'No'}</p>
      <p>Scanning: {isScanning ? 'Yes' : 'No'}</p>
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

## API Reference

### BarcodeScannerV2 Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Whether the scanner is open |
| `onScan` | `(result: BarcodeScanResult) => void` | Yes | Callback when a barcode is successfully scanned |
| `onClose` | `() => void` | Yes | Callback when the scanner is closed |
| `config` | `BarcodeScannerConfig` | No | Optional configuration for the scanner |
| `title` | `string` | No | Title to display (default: "Scan Barcode") |
| `instructions` | `string` | No | Instructions to display (default: "Position the barcode within the frame") |

### BarcodeScanResult

```typescript
interface BarcodeScanResult {
  value: string;        // The detected barcode value
  format: BarcodeFormat; // The barcode format (UPC_A, EAN_13, QR_CODE, etc.)
  timestamp: number;    // When the barcode was detected
}
```

### BarcodeScannerConfig

```typescript
interface BarcodeScannerConfig {
  formats?: BarcodeFormat[];  // Formats to detect (default: all)
  sound?: boolean;            // Play sound on detection (default: false)
  vibrate?: boolean;          // Vibrate on detection (default: false)
  camera?: 'front' | 'back';  // Camera to use (default: 'back')
  showGuide?: boolean;        // Show scanning guide (default: true)
}
```

### Supported Barcode Formats

- `UPC_A` - UPC-A (12 digits)
- `UPC_E` - UPC-E (6 digits)
- `EAN_8` - EAN-8 (8 digits)
- `EAN_13` - EAN-13 (13 digits)
- `CODE_39` - Code 39
- `CODE_93` - Code 93
- `CODE_128` - Code 128
- `QR_CODE` - QR Code
- `DATA_MATRIX` - Data Matrix
- `PDF_417` - PDF417
- `AZTEC` - Aztec
- `ITF` - ITF (Interleaved 2 of 5)
- `CODABAR` - Codabar

## Platform Implementation

### Web (Desktop & Mobile Browsers)

Uses `html5-qrcode` library for browser-based barcode scanning:
- Works in Chrome, Firefox, Safari, Edge
- Requires HTTPS (or localhost for development)
- Uses `getUserMedia` API for camera access
- Real-time detection with configurable FPS

### Mobile (iOS & Android via Capacitor)

Uses `@capacitor-mlkit/barcode-scanning` for native scanning:
- Google ML Kit for Android
- Apple Vision framework for iOS
- Full-screen native camera view
- Superior performance and accuracy
- Better low-light performance

## Permissions

### Web

The browser will automatically request camera permission when the scanner is opened.

### iOS

Add to `ios/App/App/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to scan barcodes</string>
```

### Android

Add to `android/app/src/main/AndroidManifest.xml` (usually auto-added by Capacitor):

```xml
<uses-permission android:name="android.permission.CAMERA" />
```

## Building for Mobile

After making changes, sync with Capacitor:

```bash
# Build the web app
npm run build

# Sync with mobile platforms
npx cap sync

# Open in Xcode (iOS)
npx cap open ios

# Open in Android Studio (Android)
npx cap open android
```

## Troubleshooting

### Camera not working on mobile

1. Check that camera permissions are granted
2. Run `npx cap sync` to ensure the plugin is properly installed
3. Check that the `@capacitor-mlkit/barcode-scanning` package is in `package.json`

### Scanner not detecting barcodes

1. Ensure good lighting conditions
2. Hold the device steady
3. Try adjusting the distance from the barcode
4. Check that the barcode format is in the `formats` array

### TypeScript errors

Make sure to import types from the correct location:

```typescript
import type { BarcodeScanResult } from '@/lib/barcode-scanner/types';
```

## Example Integration

See `components/diet/FoodLibraryModal.tsx` for a complete example of how to integrate the barcode scanner into your app.

## Architecture

```
lib/barcode-scanner/
├── types.ts                 # TypeScript type definitions
├── mobile-scanner.ts        # Capacitor ML Kit implementation
├── web-scanner.ts           # html5-qrcode implementation
└── index.ts                 # Public API exports

hooks/
└── useBarcodeScanner.ts     # React hook for cross-platform scanning

components/barcode/
├── BarcodeScannerV2.tsx     # Main scanner component
└── README.md                # This file
```

## License

This barcode scanner implementation is part of the Trainer App project.
