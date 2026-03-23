import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

let _deferredPrompt = null;
let _listeners = new Set();

function notify() {
  _listeners.forEach((fn) => fn(_deferredPrompt));
}

// Single global listener for beforeinstallprompt
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredPrompt = e;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    _deferredPrompt = null;
    notify();
  });
}

const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (typeof navigator !== 'undefined' && navigator.standalone)
  );
};

const isIOSSafari = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) && !ua.includes('CriOS') && !ua.includes('FxiOS');
};

/**
 * Shared hook for PWA install prompt.
 * Returns { canInstall, isIOS, isInstalled, promptInstall }
 */
export default function usePWAInstall() {
  const [prompt, setPrompt] = useState(_deferredPrompt);
  const [installed, setInstalled] = useState(Platform.OS === 'web' && isStandalone());

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const listener = (p) => {
      setPrompt(p);
      if (!p && installed === false) {
        // appinstalled fired
        setInstalled(true);
      }
    };
    _listeners.add(listener);
    return () => _listeners.delete(listener);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!_deferredPrompt) return false;
    _deferredPrompt.prompt();
    const result = await _deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      _deferredPrompt = null;
      setPrompt(null);
      setInstalled(true);
      return true;
    }
    return false;
  }, []);

  return {
    canInstall: Platform.OS === 'web' && !installed && (!!prompt || isIOSSafari()),
    isIOS: Platform.OS === 'web' && isIOSSafari(),
    isInstalled: installed,
    promptInstall,
  };
}
