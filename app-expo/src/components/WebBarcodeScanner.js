import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

/**
 * Web barcode scanner using html5-qrcode (pure JS, works on ALL browsers).
 * Handles camera access + barcode decoding internally.
 */
const WebBarcodeScanner = ({ onBarcodeScanned, active = true, style }) => {
  const containerRef = useRef(null);
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const lastScannedRef = useRef(null);
  const onBarcodeScannedRef = useRef(onBarcodeScanned);

  // Keep callback ref up to date without re-triggering effect
  useEffect(() => {
    onBarcodeScannedRef.current = onBarcodeScanned;
  }, [onBarcodeScanned]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState?.();
        // 2 = SCANNING, 3 = PAUSED
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (_) {}
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || !active) return;

    let cancelled = false;

    const startScanner = async () => {
      // Wait for DOM element to be ready
      await new Promise(r => setTimeout(r, 300));
      if (cancelled) return;

      const containerId = 'web-barcode-scanner';
      const el = document.getElementById(containerId);
      if (!el) {
        setError('nodom');
        return;
      }

      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;

        const scanner = new Html5Qrcode(containerId, /* verbose */ false);
        scannerRef.current = scanner;

        const onSuccess = (decodedText, decodedResult) => {
          if (decodedText && decodedText !== lastScannedRef.current) {
            lastScannedRef.current = decodedText;
            onBarcodeScannedRef.current?.({
              data: decodedText,
              type: decodedResult?.result?.format?.formatName || 'unknown',
            });
            setTimeout(() => { lastScannedRef.current = null; }, 3000);
          }
        };

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 5,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.5,
            disableFlip: false,
            formatsToSupport: [
              0,  // QR_CODE
              1,  // AZTEC
              2,  // CODABAR
              3,  // CODE_39
              4,  // CODE_93
              5,  // CODE_128
              6,  // DATA_MATRIX
              7,  // MAXICODE
              8,  // ITF
              9,  // EAN_13
              10, // EAN_8
              11, // PDF_417
              12, // RSS_14
              13, // RSS_EXPANDED
              14, // UPC_A
              15, // UPC_E
              16, // UPC_EAN_EXTENSION
            ],
          },
          onSuccess,
          () => {} // silently ignore scan failures (normal between frames)
        );

        if (!cancelled) setReady(true);
      } catch (err) {
        if (cancelled) return;
        console.warn('[WebBarcodeScanner]', err?.message || err);
        if (err?.message?.includes?.('permission') || err?.message?.includes?.('NotAllowed')) {
          setError('camera');
        } else if (err?.message?.includes?.('NotFound') || err?.message?.includes?.('device')) {
          setError('nocamera');
        } else {
          setError('camera');
        }
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [active, stopScanner]);

  useEffect(() => () => { stopScanner(); }, [stopScanner]);

  if (Platform.OS !== 'web') return null;

  if (error === 'camera' || error === 'nocamera') {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackIcon}>{'🔒'}</Text>
        <Text style={styles.fallbackText}>
          {error === 'nocamera'
            ? 'Aucune camera detectee.'
            : "Impossible d'acceder a la camera."}
        </Text>
        <Text style={styles.fallbackHint}>
          Verifiez les permissions dans votre navigateur, puis rechargez la page.
          {'\n'}Ou utilisez la saisie manuelle ci-dessous.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <div
        id="web-barcode-scanner"
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      />
      {!ready && !error && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Activation de la camera...</Text>
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
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0F1A',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default WebBarcodeScanner;
