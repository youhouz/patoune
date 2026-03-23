import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

/**
 * Web barcode scanner that works on ALL browsers (Chrome, Safari, Firefox).
 * Uses the barcode-detector npm package as a polyfill for BarcodeDetector.
 */
const WebBarcodeScanner = ({ onBarcodeScanned, active = true, style }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const detectorRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('init');
  const lastScannedRef = useRef(null);

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

  useEffect(() => {
    if (Platform.OS !== 'web' || !active) return;

    let cancelled = false;

    const startScanning = async () => {
      // 1. Load BarcodeDetector (native or polyfill)
      let DetectorClass = null;
      try {
        // Try native first
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          DetectorClass = window.BarcodeDetector;
        }
      } catch (_) {}

      // Use polyfill
      if (!DetectorClass) {
        try {
          setStatus('loading');
          const polyfill = require('barcode-detector/pure');
          DetectorClass = polyfill.BarcodeDetector || polyfill.default;
        } catch (_) {
          try {
            const polyfill = await import('barcode-detector/pure');
            DetectorClass = polyfill.BarcodeDetector || polyfill.default;
          } catch (_) {}
        }
      }

      if (cancelled) return;

      if (!DetectorClass) {
        setError('noapi');
        return;
      }

      // 2. Create detector with supported formats
      try {
        const allFormats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'];
        let formats = allFormats;
        try {
          const supported = await DetectorClass.getSupportedFormats();
          formats = allFormats.filter(f => supported.includes(f));
          if (formats.length === 0) formats = supported.slice(0, 10);
        } catch (_) {}
        detectorRef.current = new DetectorClass({ formats });
      } catch (e) {
        if (!cancelled) setError('noapi');
        return;
      }

      // 3. Get camera stream
      try {
        setStatus('camera');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        // Try to enable continuous autofocus
        const track = stream.getVideoTracks()[0];
        if (track) {
          try {
            const caps = track.getCapabilities?.();
            if (caps?.focusMode?.includes?.('continuous')) {
              await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
            }
          } catch (_) {}
        }

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        await video.play();

        setStatus('ready');

        // Wait for camera to stabilize and autofocus
        await new Promise(r => setTimeout(r, 800));
        if (cancelled) return;

        setStatus('scanning');

        // 4. Create canvas for frame capture (more reliable than passing video)
        const canvas = document.createElement('canvas');
        canvasRef.current = canvas;

        // 5. Start scan loop
        let isDetecting = false;
        intervalRef.current = setInterval(async () => {
          if (cancelled || isDetecting || !video.videoWidth || !detectorRef.current) return;
          isDetecting = true;
          try {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(video, 0, 0);

            const barcodes = await detectorRef.current.detect(canvas);
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              if (code && code !== lastScannedRef.current) {
                lastScannedRef.current = code;
                onBarcodeScanned?.({ data: code, type: barcodes[0].format });
                setTimeout(() => { lastScannedRef.current = null; }, 3000);
              }
            }
          } catch (_) {}
          isDetecting = false;
        }, 250);

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
  }, [active, onBarcodeScanned, stopCamera]);

  useEffect(() => stopCamera, [stopCamera]);

  if (Platform.OS !== 'web') return null;

  if (error === 'noapi') {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackIcon}>{'📷'}</Text>
        <Text style={styles.fallbackText}>
          Le scan automatique n'est pas disponible.
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
        <Text style={styles.fallbackIcon}>{'🔒'}</Text>
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
      {(status === 'loading' || status === 'camera' || status === 'ready') && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>
            {status === 'loading' ? 'Chargement du scanner...' :
             status === 'camera' ? 'Activation de la camera...' :
             'Mise au point...'}
          </Text>
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
