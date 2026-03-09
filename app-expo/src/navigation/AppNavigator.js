import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet, StatusBar, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import PWAInstallBanner from '../components/PWAInstallBanner';
import PepeteLogo from '../components/PepeteLogo';

const ONBOARDING_KEY = 'onboarding_completed';

// ─── Animated Splash Screen ──────────────────────────────
const SplashLoader = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Dots wave animation
    const animateDot = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.delay(800),
        ])
      );

    const d1 = animateDot(dot1, 0);
    const d2 = animateDot(dot2, 200);
    const d3 = animateDot(dot3, 400);
    d1.start();
    d2.start();
    d3.start();

    return () => { d1.stop(); d2.stop(); d3.stop(); };
  }, []);

  return (
    <LinearGradient colors={['#7B8B6F', '#8A9A7E', '#A3B296']} style={styles.splash}>
      <StatusBar barStyle="light-content" />

      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
        <PepeteLogo size={100} theme="light" tagline="Le meilleur pour vos animaux" />
      </Animated.View>

      <View style={styles.dotsRow}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
        ))}
      </View>
    </LinearGradient>
  );
};

// ─── App Navigator ───────────────────────────────────────
const AppNavigator = () => {
  const { user, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(null); // null = loading

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setShowOnboarding(!val);
    });
  }, []);

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  if (loading || showOnboarding === null) return <SplashLoader />;

  // Show onboarding for first-time visitors
  if (showOnboarding && !user) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Always show the full app — guest mode lets users explore Scanner & AI
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
      {/* PWA install banner — only shows on web when conditions are met */}
      <PWAInstallBanner />
    </View>
  );
};

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  circle2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  logoWrap: {
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 52,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFF',
  },
});

export default AppNavigator;
