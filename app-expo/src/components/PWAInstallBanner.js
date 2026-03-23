import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import usePWAInstall from '../hooks/usePWAInstall';
const colors = require('../utils/colors');
const { RADIUS, SHADOWS, SPACING } = require('../utils/colors');

const PWA_DISMISSED_KEY = 'pwa_install_dismissed';

const PWAInstallBanner = () => {
  const { canInstall, isIOS, isInstalled, promptInstall } = usePWAInstall();
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const slideAnim = useRef(new Animated.Value(120)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (Platform.OS !== 'web' || !canInstall || dismissed || isInstalled) return;

    AsyncStorage.getItem(PWA_DISMISSED_KEY).then((val) => {
      if (val) {
        setDismissed(true);
        return;
      }
      // Show banner after a short delay
      setTimeout(() => {
        setShowBanner(true);
        Animated.parallel([
          Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        ]).start();
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          ])
        ).start();
      }, 2000);
    });
  }, [canInstall, isInstalled]);

  const handleInstall = async () => {
    if (isIOS) {
      handleDismiss();
      return;
    }
    const accepted = await promptInstall();
    if (accepted) {
      setShowBanner(false);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 150, duration: 220, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setShowBanner(false);
      setDismissed(true);
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
            <Text style={styles.title}>Installer Pepete</Text>
            <Text style={styles.subtitle}>
              {isIOS
                ? 'Appuyez sur le bouton partager puis "Sur l\'ecran d\'accueil" pour installer.'
                : 'Accedez a Pepete directement depuis votre ecran d\'accueil, comme une vraie application.'}
            </Text>
          </View>
        </View>

        {/* Install CTA */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity style={styles.installBtn} onPress={handleInstall} activeOpacity={0.85}>
            <Text style={styles.installText}>
              {isIOS ? 'Compris !' : 'Installer l\'application'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Hints */}
        <View style={styles.hintsRow}>
          <View style={styles.hint}><Text style={styles.hintIcon}>⚡</Text><Text style={styles.hintText}>Rapide</Text></View>
          <View style={styles.hint}><Text style={styles.hintIcon}>📴</Text><Text style={styles.hintText}>Hors-ligne</Text></View>
          <View style={styles.hint}><Text style={styles.hintIcon}>🔒</Text><Text style={styles.hintText}>Securise</Text></View>
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
    paddingBottom: Platform.OS === 'ios' ? 34 : Platform.OS === 'web' ? 80 : SPACING.base,
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
