import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';

/**
 * Web barcode scanner using BarcodeDetector API with robust fallback.
 * - Tries native BarcodeDetector first (Chrome/Edge)
 * - Falls back to polyfill via CDN if unavailable (Safari/Firefox)
 * - Shows manual fallback if everything fails
 */
const WebBarcodeScanner = ({ onBarcodeScanned, active = true, style }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const detectorRef = useRef(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('init'); // init | loading | ready | scanning
  const lastScannedRef = useRef(null);
  const canvasRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Try to get a BarcodeDetector (native or polyfill)
  const getDetector = useCallback(async () => {
    const formats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'];

    // 1. Try native BarcodeDetector
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const supported = await window.BarcodeDetector.getSupportedFormats();
        const available = formats.filter(f => supported.includes(f));
        if (available.length > 0) {
          return new window.BarcodeDetector({ formats: available });
        }
      } catch (_) { /* fall through */ }
    }

    // 2. Try loading polyfill from CDN (barcode-detector package)
    try {
      setStatus('loading');
      const module = await import(
        /* webpackIgnore: true */
        'https://fastly.jsdelivr.net/npm/barcode-detector@2/dist/es/pure.min.js'
      );
      const PolyfillDetector = module.BarcodeDetector || module.default;
      if (PolyfillDetector) {
        const supported = await PolyfillDetector.getSupportedFormats();
        const available = formats.filter(f => supported.includes(f));
        if (available.length > 0) {
          return new PolyfillDetector({ formats: available });
        }
      }
    } catch (_) { /* fall through */ }

    return null;
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || !active) return;

    let cancelled = false;

    const startScanning = async () => {
      // Get detector
      const detector = await getDetector();
      if (cancelled) return;

      if (!detector) {
        setError('noapi');
        return;
      }
      detectorRef.current = detector;

      // Get camera stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            focusMode: { ideal: 'continuous' },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        await video.play();

        setStatus('ready');

        // Wait a bit for camera to stabilize
        await new Promise(r => setTimeout(r, 500));
        if (cancelled) return;

        setStatus('scanning');

        // Create a canvas for frame capture (more reliable than passing video directly)
        const canvas = document.createElement('canvas');
        canvasRef.current = canvas;

        // Scan loop with setInterval for consistent timing
        let isDetecting = false;
        intervalRef.current = setInterval(async () => {
          if (cancelled || isDetecting || !video.videoWidth) return;
          isDetecting = true;
          try {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);

            const barcodes = await detector.detect(canvas);
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              if (code && code !== lastScannedRef.current) {
                lastScannedRef.current = code;
                onBarcodeScanned?.({ data: code, type: barcodes[0].format });
                setTimeout(() => { lastScannedRef.current = null; }, 3000);
              }
            }
          } catch (_) {
            // detect() can throw on some frames
          }
          isDetecting = false;
        }, 300); // Scan every 300ms

      } catch (err) {
        if (!cancelled) {
          console.warn('[WebBarcodeScanner] Camera error:', err.message);
          setError('camera');
        }
      }
    };

    startScanning();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [active, onBarcodeScanned, stopCamera, getDetector]);

  // Cleanup on unmount
  useEffect(() => stopCamera, [stopCamera]);

  if (Platform.OS !== 'web') return null;

  if (error === 'noapi') {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackIcon}>📷</Text>
        <Text style={styles.fallbackText}>
          Le scan automatique n'est pas disponible sur ce navigateur.
        </Text>
        <Text style={styles.fallbackHint}>
          Utilisez la saisie manuelle ci-dessous pour entrer le code-barres.
        </Text>
      </View>
    );
  }

  if (error === 'camera') {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackIcon}>🔒</Text>
        <Text style={styles.fallbackText}>
          Impossible d'accéder à la caméra.
        </Text>
        <Text style={styles.fallbackHint}>
          Vérifiez les permissions dans les paramètres de votre navigateur, puis rechargez la page.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <video
        ref={videoRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        muted
        playsInline
        autoPlay
      />
      {status === 'loading' && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Chargement du scanner...</Text>
        </View>
      )}
      {status === 'ready' && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Mise au point...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#0D0F1A',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0D0F1A',
  },
  fallbackIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  fallbackText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  fallbackHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
});

export default WebBarcodeScanner;
