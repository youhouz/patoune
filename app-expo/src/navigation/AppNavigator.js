import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet, StatusBar, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { PawIcon } from '../components/Logo';
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
    <LinearGradient colors={['#527A56', '#6B8F71', '#8CB092']} style={styles.splash}>
      <StatusBar barStyle="light-content" />

      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
        <View style={styles.pawCircle}>
          <PawIcon size={48} color="#FFF" />
        </View>
        <Text style={styles.splashLogo}>pépète.</Text>
        <Text style={styles.splashTagline}>Le meilleur pour vos animaux</Text>
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
  pawCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  splashLogo: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
    textTransform: 'none',
    marginBottom: 8,
  },
  splashTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    letterSpacing: 0.3,
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
