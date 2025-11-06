'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Camera } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export default function BarcodeScanner({
  isOpen,
  onClose,
  onScan
}: BarcodeScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Stop camera and barcode reader when modal closes
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setScanning(false);
      return;
    }

    // Request camera permission and start scanning
    const startScanning = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' } // Use back camera on mobile
        });

        streamRef.current = stream;
        setHasPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Initialize barcode reader
          codeReaderRef.current = new BrowserMultiFormatReader();
          setScanning(true);

          // Start continuous barcode detection
          codeReaderRef.current.decodeFromVideoElement(
            videoRef.current,
            (result, error) => {
              if (result) {
                const barcode = result.getText();
                console.log('Barcode detected:', barcode);

                // Stop scanning and trigger callback
                if (codeReaderRef.current) {
                  codeReaderRef.current.reset();
                }
                setScanning(false);
                onScan(barcode);
                onClose();
              }

              // Ignore errors during continuous scanning (expected when no barcode is visible)
              if (error && error.name !== 'NotFoundException') {
                console.error('Barcode scan error:', error);
              }
            }
          );
        }
      } catch (err) {
        console.error('Camera error:', err);
        setHasPermission(false);
        setError('Could not access camera. Please check permissions.');
      }
    };

    startScanning();

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setScanning(false);
    };
  }, [isOpen, onScan, onClose]);

  const handleManualEntry = () => {
    const barcode = prompt('Enter barcode manually:');
    if (barcode) {
      onScan(barcode);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 md:rounded-2xl shadow-2xl w-full h-full md:max-w-md md:max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan Barcode
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Camera View */}
        <div className="flex-1 bg-black relative min-h-[400px] md:min-h-[500px]">
          {hasPermission === null && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <Camera className="w-12 h-12 mx-auto mb-2 animate-pulse" />
                <p>Requesting camera access...</p>
              </div>
            </div>
          )}

          {hasPermission === false && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="text-white text-center">
                <X className="w-12 h-12 mx-auto mb-2 text-red-400" />
                <p className="mb-4">{error}</p>
                <button
                  onClick={handleManualEntry}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Enter Manually
                </button>
              </div>
            </div>
          )}

          {hasPermission && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Scanning Frame Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-4 border-green-400 rounded-lg w-64 h-40 relative">
                  {/* Corner decorations */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>

                  {/* Scanning line animation */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-green-400 animate-pulse"></div>

                  {/* Scanning status */}
                  {scanning && (
                    <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
                      Scanning...
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Position the barcode within the frame
          </p>
          <button
            onClick={handleManualEntry}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
          >
            Enter Barcode Manually
          </button>
        </div>
      </div>
    </div>
  );
}
