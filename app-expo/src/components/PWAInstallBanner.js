import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const colors = require('../utils/colors');
const { RADIUS, SHADOWS, SPACING } = require('../utils/colors');

const PWA_DISMISSED_KEY = 'pwa_install_dismissed';

const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const slideAnim = useRef(new Animated.Value(120)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return;

    AsyncStorage.getItem(PWA_DISMISSED_KEY).then((val) => {
      if (val) return;

      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowBanner(true);

        // Entrance animation
        Animated.parallel([
          Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        ]).start();

        // Subtle pulse to draw attention to install button
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          ])
        ).start();
      };

      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 150, duration: 220, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setShowBanner(false);
      AsyncStorage.setItem(PWA_DISMISSED_KEY, 'true');
    });
  };

  if (!showBanner || Platform.OS !== 'web') return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.banner}>
        {/* Close button - top right */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleDismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        {/* Top row: icon + text */}
        <View style={styles.topRow}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>🐾</Text>
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>Installer Pépète</Text>
            <Text style={styles.subtitle}>
              Accédez à Pépète directement depuis votre écran d'accueil, comme une vraie application.
            </Text>
          </View>
        </View>

        {/* Install CTA */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity style={styles.installBtn} onPress={handleInstall} activeOpacity={0.85}>
            <Text style={styles.installText}>Ajouter à l'écran d'accueil</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Hints */}
        <View style={styles.hintsRow}>
          <View style={styles.hint}><Text style={styles.hintIcon}>⚡</Text><Text style={styles.hintText}>Rapide</Text></View>
          <View style={styles.hint}><Text style={styles.hintIcon}>📴</Text><Text style={styles.hintText}>Hors-ligne</Text></View>
          <View style={styles.hint}><Text style={styles.hintIcon}>🔒</Text><Text style={styles.hintText}>Sécurisé</Text></View>
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
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.base,
    zIndex: 1000,
  },
  banner: {
    backgroundColor: colors.white,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    ...SHADOWS.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 14,
    zIndex: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 13,
    color: colors.textTertiary,
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
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: colors.primary + '15',
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
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  installBtn: {
    backgroundColor: colors.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    ...SHADOWS.glow(colors.primary),
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
    color: colors.textTertiary,
    fontWeight: '600',
  },
});

export default PWAInstallBanner;
