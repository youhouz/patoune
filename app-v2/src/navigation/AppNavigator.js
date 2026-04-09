import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, LinkingConfiguration } from '@react-navigation/native';
import { View, Text, StyleSheet, StatusBar, Animated, Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import PWAInstallBanner from '../components/PWAInstallBanner';
import { PepeteIcon } from '../components/PepeteLogo';

const ONBOARDING_KEY = 'onboarding_v3';
const REFERRAL_STORAGE_KEY = 'pending_referral_code';

// ─── Animated Dot ────────────────────────────────────────
const LoadingDot = ({ delay }) => {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        Animated.delay(600 - delay),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View style={[st.loadDot, { opacity: anim, transform: [{ scale: anim }] }]} />
  );
};

// ─── Splash Screen ───────────────────────────────────────
const SplashLoader = () => {
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 40, friction: 6, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={st.splash}>
      <StatusBar barStyle="dark-content" />

      <Animated.View style={[st.center, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Animated.View style={[st.iconRing, { transform: [{ scale: pulse }] }]}>
          <View style={st.iconContainer}>
            <PepeteIcon size={56} gradientColors={['#527A56', '#6B8F71']} />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
          <Text style={st.title}>
            p&#233;p&#232;te<Text style={st.titleDot}>.</Text>
          </Text>
          <Text style={st.tagline}>Le compagnon de vos compagnons</Text>

          <View style={st.dotsRow}>
            <LoadingDot delay={0} />
            <LoadingDot delay={200} />
            <LoadingDot delay={400} />
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const st = StyleSheet.create({
  splash: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FAF6EE',
  },
  center: { alignItems: 'center' },
  iconRing: {
    width: 120, height: 120, borderRadius: 36,
    borderWidth: 1.5, borderColor: 'rgba(82,122,86,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
  },
  iconContainer: {
    width: 96, height: 96, borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#527A56', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 6,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 38, color: '#2C2825',
    letterSpacing: 1, textAlign: 'center',
    marginBottom: 6,
  },
  titleDot: { color: '#527A56' },
  tagline: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14, color: '#8A9A8C',
    letterSpacing: 0.3, textAlign: 'center',
    marginBottom: 32,
  },
  dotsRow: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
  },
  loadDot: {
    width: 7, height: 7, borderRadius: 4,
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

    // Capture referral code + UTM params from URL
    if (Platform.OS === 'web') {
      try {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref) {
          AsyncStorage.setItem(REFERRAL_STORAGE_KEY, ref.toUpperCase());
        }
        // UTM tracking
        const utmSource = params.get('utm_source');
        const utmMedium = params.get('utm_medium');
        const utmCampaign = params.get('utm_campaign');
        if (utmSource) AsyncStorage.setItem('utm_source', utmSource);
        if (utmMedium) AsyncStorage.setItem('utm_medium', utmMedium);
        if (utmCampaign) AsyncStorage.setItem('utm_campaign', utmCampaign);
        // Clean URL
        const url = new URL(window.location.href);
        ['ref', 'utm_source', 'utm_medium', 'utm_campaign'].forEach(k => url.searchParams.delete(k));
        window.history.replaceState({}, '', url.toString());
      } catch (_) {}
    }
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
