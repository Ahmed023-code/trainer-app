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
  const [videoReady, setVideoReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  const addDebugLog = (message: string) => {
    setDebugInfo(prev => [...prev.slice(-8), `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log('[Barcode]', message);
  };

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
      setVideoReady(false);
      setHasPermission(null);
      setError('');
      setDebugInfo([]);
      return;
    }

    // Request camera permission and start scanning
    const startScanning = async () => {
      try {
        addDebugLog('Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        addDebugLog('Camera access granted!');
        streamRef.current = stream;
        setHasPermission(true);

        // Wait a tick for React to render the video element
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!videoRef.current) {
          addDebugLog('ERROR: Video element not found!');
          setError('Video element not mounted');
          return;
        }

        const video = videoRef.current;
        addDebugLog('Attaching stream to video...');

        // Directly set srcObject
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;

        addDebugLog(`Initial readyState: ${video.readyState}`);

        // Wait for metadata and play
        const playVideo = async () => {
          try {
            addDebugLog('Starting video playback...');
            await video.play();
            addDebugLog('✅ Video playing!');
            setVideoReady(true);

            // Check dimensions after a moment
            setTimeout(() => {
              const w = video.videoWidth;
              const h = video.videoHeight;
              addDebugLog(`Video dimensions: ${w}x${h}`);

              if (w > 0 && h > 0) {
                // Initialize barcode scanner
                addDebugLog('Starting barcode scanner...');
                codeReaderRef.current = new BrowserMultiFormatReader();
                setScanning(true);

                codeReaderRef.current.decodeFromVideoElement(
                  video,
                  (result, error) => {
                    if (result) {
                      const barcode = result.getText();
                      addDebugLog(`✅ Scanned: ${barcode}`);
                      if (codeReaderRef.current) {
                        codeReaderRef.current.reset();
                      }
                      setScanning(false);
                      onScan(barcode);
                      onClose();
                    }
                  }
                );
                addDebugLog('✅ Scanner active!');
              } else {
                addDebugLog('⚠️ Video has no dimensions!');
                setError('Camera feed has no dimensions');
              }
            }, 1000);
          } catch (err) {
            addDebugLog(`❌ Play failed: ${err}`);
            setError(`Play failed: ${err}`);
          }
        };

        // Listen for loadedmetadata
        video.addEventListener('loadedmetadata', () => {
          addDebugLog('📹 Metadata loaded');
          playVideo();
        }, { once: true });

        // Fallback if metadata already loaded
        if (video.readyState >= 1) {
          addDebugLog('Metadata already ready');
          playVideo();
        }

      } catch (err) {
        addDebugLog(`❌ Camera error: ${err}`);
        setHasPermission(false);
        setError(`Camera error: ${err}`);
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
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setScanning(false);
      setVideoReady(false);
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
        <div className="flex-1 bg-black relative overflow-hidden">
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
              {/* Debug toggle button */}
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold"
                style={{ zIndex: 30 }}
              >
                {showDebug ? 'Hide' : 'Show'} Debug
              </button>

              {/* Comprehensive debug overlay */}
              {showDebug && (
                <div className="absolute top-12 left-2 right-2 bg-black bg-opacity-95 text-white text-xs p-3 rounded-lg font-mono max-h-[250px] overflow-y-auto" style={{ zIndex: 30 }}>
                  <div className="font-bold mb-2 text-sm text-yellow-400">Debug Info:</div>
                  <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                    <div>Ready: {videoReady ? '✅ YES' : '❌ NO'}</div>
                    <div>Scanning: {scanning ? '✅ YES' : '❌ NO'}</div>
                    <div>Stream: {streamRef.current ? '✅ YES' : '❌ NO'}</div>
                    <div>Video: {videoRef.current ? '✅ YES' : '❌ NO'}</div>
                  </div>
                  {videoRef.current && (
                    <div className="mb-2 text-xs bg-white/10 p-2 rounded">
                      <div>Width: {videoRef.current.videoWidth || 0}px</div>
                      <div>Height: {videoRef.current.videoHeight || 0}px</div>
                      <div>ReadyState: {videoRef.current.readyState}/4</div>
                      <div>Paused: {videoRef.current.paused ? 'YES' : 'NO'}</div>
                    </div>
                  )}
                  <div className="border-t border-white/20 pt-2 space-y-1">
                    <div className="font-bold text-yellow-400 mb-1">Event Log:</div>
                    {debugInfo.length === 0 && <div className="opacity-50">Waiting...</div>}
                    {debugInfo.map((log, i) => (
                      <div key={i} className="text-[10px] leading-tight">{log}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error display */}
              {error && (
                <div className="absolute bottom-20 left-2 right-2 bg-red-600 text-white text-sm p-3 rounded-lg shadow-lg" style={{ zIndex: 30 }}>
                  <div className="font-bold mb-1">❌ Error:</div>
                  <div>{error}</div>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  backgroundColor: '#000',
                  zIndex: 1
                }}
              />

              {/* Scanning Frame Overlay */}
              {videoReady && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 10 }}>
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
              )}
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
