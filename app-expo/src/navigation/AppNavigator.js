// ---------------------------------------------------------------------------
// Patoune v2.0 - App Navigator
// Premium charcoal splash screen with pulsing paw and loading dots
// ---------------------------------------------------------------------------

import React, { useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet, StatusBar, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import { COLORS } from '../utils/colors';
import { FONTS } from '../utils/typography';


// ---------------------------------------------------------------------------
// Splash / Loading screen
// ---------------------------------------------------------------------------
const SplashLoader = () => {
  // Slow pulse animation for the paw icon
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Fade-in for brand text
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Loading dots opacity cycle
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Paw pulse: scale 1 -> 1.08 -> 1, looping
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Brand text fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Loading dots staggered animation
    const animateDot = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 500,
            delay,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

    animateDot(dot1, 0).start();
    animateDot(dot2, 200).start();
    animateDot(dot3, 400).start();
  }, []);

  return (
    <LinearGradient
      colors={COLORS.gradientCharcoal}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
      style={styles.splash}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.charcoal} />

      {/* Paw icon with pulse */}
      <Animated.View
        style={[
          styles.pawContainer,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <Ionicons name="paw" size={56} color={COLORS.primary} />
      </Animated.View>

      {/* Brand name */}
      <Animated.Text style={[styles.splashLogo, { opacity: fadeAnim }]}>
        patoune
      </Animated.Text>

      {/* Loading dots */}
      <View style={styles.loaderDots}>
        <Animated.View style={[styles.dot, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { opacity: dot2 }]} />
        <Animated.View style={[styles.dot, { opacity: dot3 }]} />
      </View>
    </LinearGradient>
  );
};


// ---------------------------------------------------------------------------
// Navigator
// ---------------------------------------------------------------------------
const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashLoader />;
  }

  return (
    <NavigationContainer>
      {user ? <TabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};


// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pawContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(196, 112, 75, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  splashLogo: {
    fontFamily: FONTS.brand,
    fontSize: 44,
    color: COLORS.white,
    letterSpacing: -0.5,
    textTransform: 'lowercase',
  },
  loaderDots: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});


export default AppNavigator;
