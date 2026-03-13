import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../utils/colors';

const PWA_DISMISSED_KEY = 'pwa_install_dismissed';

const isIOSSafari = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) && !ua.includes('CriOS') && !ua.includes('FxiOS');
};

const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (typeof navigator !== 'undefined' && navigator.standalone === true)
  );
};

const HINTS = [
  { icon: '\u26A1', label: 'Rapide' },
  { icon: '\uD83D\uDCF4', label: 'Hors-ligne' },
  { icon: '\uD83D\uDD12', label: 'Securise' },
];

const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const slideAnim = useRef(new Animated.Value(120)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const deferredPromptRef = useRef(null);

  const showBannerAnimation = useCallback(() => {
    setShowBanner(true);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();
  }, [slideAnim, fadeAnim, pulseAnim]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (isStandalone()) return;

    let fallbackTimer;

    AsyncStorage.getItem(PWA_DISMISSED_KEY).then((val) => {
      if (val) return;

      if (isIOSSafari()) {
        setIsIOS(true);
        fallbackTimer = setTimeout(() => showBannerAnimation(), 2000);
        return;
      }

      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        deferredPromptRef.current = e;
        showBannerAnimation();
      };

      window.addEventListener('beforeinstallprompt', handler);

      fallbackTimer = setTimeout(() => {
        if (!deferredPromptRef.current) {
          showBannerAnimation();
        }
      }, 3000);

      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
      };
    });

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [showBannerAnimation]);

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 150, duration: 220, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setShowBanner(false);
      AsyncStorage.setItem(PWA_DISMISSED_KEY, 'true');
    });
  }, [slideAnim, fadeAnim]);

  const handleInstall = useCallback(async () => {
    if (isIOS || !deferredPrompt) {
      handleDismiss();
      return;
    }
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
    deferredPromptRef.current = null;
  }, [isIOS, deferredPrompt, handleDismiss]);

  if (!showBanner || Platform.OS !== 'web') return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.banner}>
        {/* Close button */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleDismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.closeText}>{'\u2715'}</Text>
        </TouchableOpacity>

        {/* Top row: icon + text */}
        <View style={styles.topRow}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>{'\uD83D\uDC3E'}</Text>
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>Installer Pepete</Text>
            <Text style={styles.subtitle}>
              {isIOS
                ? "Appuyez sur le bouton partager puis \"Sur l'ecran d'accueil\" pour installer."
                : "Accedez a Pepete directement depuis votre ecran d'accueil, comme une vraie application."}
            </Text>
          </View>
        </View>

        {/* Install CTA */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity style={styles.installBtn} onPress={handleInstall} activeOpacity={0.85}>
            <Text style={styles.installText}>
              {isIOS ? 'Compris !' : "Ajouter a l'ecran d'accueil"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Hints */}
        <View style={styles.hintsRow}>
          {HINTS.map(({ icon, label }) => (
            <View key={label} style={styles.hint}>
              <Text style={styles.hintIcon}>{icon}</Text>
              <Text style={styles.hintText}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.base,
    paddingBottom: Platform.select({
      ios: 34,
      web: 80,
      default: SPACING.base,
    }),
    zIndex: 1000,
  },
  banner: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    ...SHADOWS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 14,
    zIndex: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontWeight: '700',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '15',
  },
  icon: {
    fontSize: 28,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  installBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    ...SHADOWS.glow(COLORS.primary),
  },
  installText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  hintsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.md,
    gap: SPACING.lg,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hintIcon: {
    fontSize: 12,
  },
  hintText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
});

export default PWAInstallBanner;
