import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

/**
 * Web-only barcode scanner using the native BarcodeDetector API.
 * Falls back to a message if the API is unavailable.
 */
const WebBarcodeScanner = ({ onBarcodeScanned, active = true, style }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const detectorRef = useRef(null);
  const [error, setError] = useState(null);
  const lastScannedRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || !active) return;

    // Check BarcodeDetector support
    if (typeof window === 'undefined' || !('BarcodeDetector' in window)) {
      setError('noapi');
      return;
    }

    let cancelled = false;
    detectorRef.current = new window.BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'],
    });

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          scanLoop();
        }
      } catch (err) {
        if (!cancelled) setError('camera');
      }
    };

    const scanLoop = async () => {
      if (cancelled || !videoRef.current || !detectorRef.current) return;
      try {
        const barcodes = await detectorRef.current.detect(videoRef.current);
        if (cancelled) return; // Re-check after async detect()
        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          // Debounce: don't fire same code within 3s
          if (code && code !== lastScannedRef.current) {
            lastScannedRef.current = code;
            onBarcodeScanned?.({ data: code, type: barcodes[0].format });
            setTimeout(() => {
              lastScannedRef.current = null;
            }, 3000);
          }
        }
      } catch (_) {
        // detect() can throw on some frames, ignore
      }
      if (!cancelled) {
        rafRef.current = requestAnimationFrame(scanLoop);
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [active, onBarcodeScanned, stopCamera]);

  // Cleanup on unmount
  useEffect(() => stopCamera, [stopCamera]);

  if (Platform.OS !== 'web') return null;

  if (error === 'noapi') {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>
          Le scan automatique n'est pas supporté par ce navigateur.
        </Text>
        <Text style={styles.fallbackHint}>
          Utilisez Chrome ou Edge, ou saisissez le code manuellement.
        </Text>
      </View>
    );
  }

  if (error === 'camera') {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>
          Impossible d'accéder à la caméra.
        </Text>
        <Text style={styles.fallbackHint}>
          Vérifiez les permissions ou saisissez le code manuellement.
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
      />
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
  fallbackText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  fallbackHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default WebBarcodeScanner;
