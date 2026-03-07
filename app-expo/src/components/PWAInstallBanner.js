import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const colors = require('../utils/colors');
const { RADIUS, SHADOWS } = require('../utils/colors');

const PWA_DISMISSED_KEY = 'pwa_install_dismissed';

const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const slideAnim = useState(() => new Animated.Value(100))[0];

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Check if already in standalone (installed) mode
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return;

    // Check if user already dismissed
    AsyncStorage.getItem(PWA_DISMISSED_KEY).then((val) => {
      if (val) return;

      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowBanner(true);
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        }).start();
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
    Animated.timing(slideAnim, {
      toValue: 150,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowBanner(false);
      AsyncStorage.setItem(PWA_DISMISSED_KEY, 'true');
    });
  };

  if (!showBanner || Platform.OS !== 'web') return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.banner}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>🐾</Text>
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Installer Patoune</Text>
          <Text style={styles.subtitle}>Acces rapide depuis ton ecran d'accueil</Text>
        </View>
        <TouchableOpacity style={styles.installBtn} onPress={handleInstall} activeOpacity={0.8}>
          <Text style={styles.installText}>Installer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeBtn} onPress={handleDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    zIndex: 1000,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    ...SHADOWS.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  installBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    marginLeft: 10,
  },
  installText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  closeBtn: {
    marginLeft: 8,
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    color: colors.textTertiary,
    fontWeight: '600',
  },
});

export default PWAInstallBanner;
