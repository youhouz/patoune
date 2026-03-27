import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet, StatusBar, Animated, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import PWAInstallBanner from '../components/PWAInstallBanner';
import { PepeteIcon } from '../components/PepeteLogo';

const ONBOARDING_KEY = 'onboarding_v3';

// ─── Splash Screen — same DA as the rest of the app ─────
const SplashLoader = () => {
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const loaderWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(loaderWidth, { toValue: 1, duration: 1800, useNativeDriver: false }),
        Animated.timing(loaderWidth, { toValue: 0, duration: 0, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  return (
    <View style={st.splash}>
      <StatusBar barStyle="dark-content" />
      <View style={st.bgCircle1} />
      <View style={st.bgCircle2} />

      <Animated.View style={[st.center, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <View style={st.iconContainer}>
          <PepeteIcon size={72} gradientColors={['#527A56', '#6B8F71']} />
        </View>

        <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
          <Text style={st.title}>
            p&#233;p&#232;te<Text style={st.titleDot}>.</Text>
          </Text>

          <View style={st.loaderTrack}>
            <Animated.View style={[st.loaderFill, {
              width: loaderWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            }]} />
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const st = StyleSheet.create({
  splash: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FAF6EE', overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute', top: -100, right: -80,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(107,143,113,0.06)',
  },
  bgCircle2: {
    position: 'absolute', bottom: -60, left: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(107,143,113,0.04)',
  },
  center: { alignItems: 'center', zIndex: 2 },
  iconContainer: {
    width: 110, height: 110, borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#527A56', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 6,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 42, color: '#2C2825',
    letterSpacing: 2, textAlign: 'center',
    marginBottom: 28,
  },
  titleDot: { color: '#527A56' },
  loaderTrack: {
    width: 100, height: 3,
    backgroundColor: 'rgba(107,143,113,0.12)', borderRadius: 2,
    overflow: 'hidden',
  },
  loaderFill: {
    height: '100%', borderRadius: 2,
    backgroundColor: '#527A56',
  },
});

// ─── App Navigator ───────────────────────────────────────
const AppNavigator = () => {
  const { loading, isAuthenticated } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(null);
  const navigationRef = useRef(null);

  useEffect(() => {
    if (loading) return;
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setShowOnboarding(!val);
    });
  }, [loading]);

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  if (loading || showOnboarding === null) return <SplashLoader />;

  if (showOnboarding && !isAuthenticated) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          if (Platform.OS === 'web') {
            navigationRef.current?.resetRoot({
              index: 0,
              routes: [{ name: 'Tabs', state: { routes: [{ name: 'Accueil' }] } }],
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

export default AppNavigator;
