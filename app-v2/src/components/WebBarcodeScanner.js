import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

/**
 * Web barcode scanner using html5-qrcode (pure JS, works on ALL browsers).
 */
const WebBarcodeScanner = ({ onBarcodeScanned, active = true, style }) => {
  const containerRef = useRef(null);
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const lastScannedRef = useRef(null);
  const onBarcodeScannedRef = useRef(onBarcodeScanned);

  useEffect(() => {
    onBarcodeScannedRef.current = onBarcodeScanned;
  }, [onBarcodeScanned]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState?.();
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
      await new Promise(r => setTimeout(r, 300));
      if (cancelled) return;

      const containerId = 'web-barcode-scanner';
      const el = document.getElementById(containerId);
      if (!el) return;

      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;

        const scanner = new Html5Qrcode(containerId, false);
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
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => ({
              width: Math.floor(viewfinderWidth * 0.92),
              height: Math.floor(viewfinderHeight * 0.92),
            }),
            aspectRatio: 1.5,
            disableFlip: false,
            formatsToSupport: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],
          },
          onSuccess,
          () => {}
        );

        // Remove html5-qrcode dark overlay around scan area
        try {
          const style = document.createElement('style');
          style.textContent = `
            #web-barcode-scanner video { object-fit: cover !important; }
            #web-barcode-scanner img[alt="Info icon"] { display: none !important; }
            #qr-shaded-region { border-color: transparent !important; }
            #web-barcode-scanner > div { background: transparent !important; }
          `;
          document.head.appendChild(style);
        } catch (_) {}

        if (!cancelled) setReady(true);
      } catch (err) {
        if (cancelled) return;
        console.warn('[WebBarcodeScanner]', err?.message || err);
        setError(err?.message?.includes?.('NotFound') ? 'nocamera' : 'camera');
      }
    };

    startScanner();
    return () => { cancelled = true; stopScanner(); };
  }, [active, stopScanner]);

  useEffect(() => () => { stopScanner(); }, [stopScanner]);

  if (Platform.OS !== 'web') return null;

  if (error) {
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
  container: { flex: 1, overflow: 'hidden', backgroundColor: 'transparent' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#1a1a2e' },
  fallbackIcon: { fontSize: 40, marginBottom: 16 },
  fallbackText: { color: 'rgba(255,255,255,0.85)', fontSize: 15, textAlign: 'center', marginBottom: 8, fontWeight: '600' },
  fallbackHint: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  loadingText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, overflow: 'hidden' },
});

export default WebBarcodeScanner;
