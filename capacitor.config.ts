import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.trainerapp.mobile',
  appName: 'Trainer App',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#000000",
      showSpinner: false,
    },
    BarcodeScanner: {
      // Enable all barcode formats by default
      // Formats can be configured per-scan via the API
      formats: [
        'AZTEC',
        'CODABAR',
        'CODE_39',
        'CODE_93',
        'CODE_128',
        'DATA_MATRIX',
        'EAN_8',
        'EAN_13',
        'ITF',
        'PDF_417',
        'QR_CODE',
        'UPC_A',
        'UPC_E'
      ]
    }
  }
};

export default config;
