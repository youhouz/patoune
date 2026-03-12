import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet, StatusBar, Animated, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { PawIcon } from '../components/Logo';
const { COLORS } = require('../utils/colors');
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import PWAInstallBanner from '../components/PWAInstallBanner';

const ONBOARDING_KEY = 'onboarding_v3';

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
    <View style={styles.splash}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Ambient glow orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
        <View style={styles.pawCircle}>
          <PawIcon size={46} color="#080B12" />
        </View>
        <Text style={styles.splashLogo}>Pépète</Text>
        <Text style={styles.splashTagline}>Le meilleur pour vos animaux</Text>
      </Animated.View>

      <View style={styles.dotsRow}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[styles.dot, i === 1 && styles.dotMid, { opacity: dot }]} />
        ))}
      </View>
    </View>
  );
};

// ─── App Navigator ───────────────────────────────────────
const AppNavigator = () => {
  const { user, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(null);
  const navigationRef = useRef(null);

  useEffect(() => {
    if (loading) return;
    // On web: show onboarding whenever user is not logged in
    // (prevents localStorage key from blocking the welcome slides)
    if (Platform.OS === 'web') {
      setShowOnboarding(!user);
    } else {
      AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
        setShowOnboarding(!val);
      });
    }
  }, [loading, user]);

  const handleOnboardingComplete = async () => {
    if (Platform.OS !== 'web') {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    }
    setShowOnboarding(false);
  };

  // Show splash while loading auth state or checking onboarding flag
  if (loading || showOnboarding === null) return <SplashLoader />;

  // Unauthenticated visitors see the onboarding slider first
  if (showOnboarding && !user) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Full app — Scanner & AI are accessible without login (guest mode)
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          // On web, always reset to Accueil to ignore any saved /login URL
          if (Platform.OS === 'web') {
            navigationRef.current?.resetRoot({
              index: 0,
              routes: [{ name: 'Accueil' }],
            });
          }
        }}
      >
        <TabNavigator />
      </NavigationContainer>
      <PWAInstallBanner />
    </View>
  );
};

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#080B12',
  },
  orb1: {
    position: 'absolute',
    top: -80,
    left: '50%',
    marginLeft: -120,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(0,230,118,0.06)',
  },
  orb2: {
    position: 'absolute',
    bottom: -100,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(167,139,250,0.04)',
  },
  logoWrap: {
    alignItems: 'center',
  },
  pawCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#00E676',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.50,
    shadowRadius: 28,
    elevation: 12,
  },
  splashLogo: {
    fontSize: 44,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -1.5,
    marginBottom: 8,
  },
  splashTagline: {
    fontSize: 15,
    color: 'rgba(248,250,252,0.55)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 52,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E676',
  },
  dotMid: {
    backgroundColor: '#A78BFA',
  },
});

export default AppNavigator;
