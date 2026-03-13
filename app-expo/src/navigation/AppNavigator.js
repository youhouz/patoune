import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet, StatusBar, Animated, Platform } from 'react-native';
import Svg, { Path, Circle, Ellipse, Polygon, Line, G } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import PWAInstallBanner from '../components/PWAInstallBanner';

const ONBOARDING_KEY = 'onboarding_v3';

// ─── SVG Animals ─────────────────────────────────────────
const CatSVG = () => (
  <Svg width={70} height={70} viewBox="0 0 80 80" fill="none">
    <Ellipse cx="40" cy="52" rx="18" ry="20" fill="rgba(107,143,113,0.25)" stroke="rgba(107,143,113,0.6)" strokeWidth="1.5"/>
    <Circle cx="40" cy="28" r="14" fill="rgba(107,143,113,0.25)" stroke="rgba(107,143,113,0.6)" strokeWidth="1.5"/>
    <Polygon points="29,18 26,8 34,16" fill="rgba(107,143,113,0.4)" stroke="rgba(107,143,113,0.7)" strokeWidth="1" strokeLinejoin="round"/>
    <Polygon points="51,18 54,8 46,16" fill="rgba(107,143,113,0.4)" stroke="rgba(107,143,113,0.7)" strokeWidth="1" strokeLinejoin="round"/>
    <Ellipse cx="35" cy="27" rx="2.5" ry="3" fill="rgba(245,240,232,0.9)"/>
    <Ellipse cx="45" cy="27" rx="2.5" ry="3" fill="rgba(245,240,232,0.9)"/>
    <Circle cx="35" cy="28" r="1.2" fill="#1A2E1D"/>
    <Circle cx="45" cy="28" r="1.2" fill="#1A2E1D"/>
    <Path d="M39 32 L41 32 L40 33.5 Z" fill="rgba(196,149,106,0.8)"/>
    <Path d="M38 34 Q40 36 42 34" stroke="rgba(107,143,113,0.7)" strokeWidth="1" fill="none" strokeLinecap="round"/>
    <Line x1="26" y1="31" x2="36" y2="32" stroke="rgba(245,240,232,0.5)" strokeWidth="0.8" strokeLinecap="round"/>
    <Line x1="44" y1="32" x2="54" y2="31" stroke="rgba(245,240,232,0.5)" strokeWidth="0.8" strokeLinecap="round"/>
    <Path d="M58 60 Q68 48 62 36 Q58 28 62 22" stroke="rgba(107,143,113,0.6)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
  </Svg>
);

const DogSVG = () => (
  <Svg width={80} height={64} viewBox="0 0 96 72" fill="none">
    <Ellipse cx="48" cy="38" rx="28" ry="18" fill="rgba(196,149,106,0.22)" stroke="rgba(196,149,106,0.55)" strokeWidth="1.5"/>
    <Circle cx="76" cy="28" r="14" fill="rgba(196,149,106,0.22)" stroke="rgba(196,149,106,0.55)" strokeWidth="1.5"/>
    <Ellipse cx="68" cy="22" rx="5" ry="9" fill="rgba(196,149,106,0.35)" stroke="rgba(196,149,106,0.6)" strokeWidth="1"/>
    <Circle cx="80" cy="26" r="2.5" fill="rgba(245,240,232,0.9)"/>
    <Circle cx="80" cy="26.5" r="1.2" fill="#1A2E1D"/>
    <Ellipse cx="88" cy="31" rx="3.5" ry="2.5" fill="rgba(196,149,106,0.55)"/>
    <Line x1="32" y1="52" x2="24" y2="66" stroke="rgba(196,149,106,0.6)" strokeWidth="3" strokeLinecap="round"/>
    <Line x1="42" y1="54" x2="36" y2="68" stroke="rgba(196,149,106,0.6)" strokeWidth="3" strokeLinecap="round"/>
    <Line x1="58" y1="52" x2="62" y2="66" stroke="rgba(196,149,106,0.6)" strokeWidth="3" strokeLinecap="round"/>
    <Path d="M20 30 Q10 20 14 10 Q16 4 20 6" stroke="rgba(196,149,106,0.55)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
  </Svg>
);

const RabbitSVG = () => (
  <Svg width={56} height={72} viewBox="0 0 64 80" fill="none">
    <Ellipse cx="32" cy="58" rx="20" ry="18" fill="rgba(140,176,146,0.22)" stroke="rgba(140,176,146,0.55)" strokeWidth="1.5"/>
    <Ellipse cx="32" cy="36" rx="14" ry="13" fill="rgba(140,176,146,0.22)" stroke="rgba(140,176,146,0.55)" strokeWidth="1.5"/>
    <Ellipse cx="24" cy="14" rx="6" ry="16" fill="rgba(140,176,146,0.25)" stroke="rgba(140,176,146,0.6)" strokeWidth="1.5"/>
    <Ellipse cx="40" cy="14" rx="6" ry="16" fill="rgba(140,176,146,0.25)" stroke="rgba(140,176,146,0.6)" strokeWidth="1.5"/>
    <Circle cx="27" cy="34" r="3" fill="rgba(245,240,232,0.9)"/>
    <Circle cx="37" cy="34" r="3" fill="rgba(245,240,232,0.9)"/>
    <Circle cx="27" cy="34.5" r="1.4" fill="#1A2E1D"/>
    <Circle cx="37" cy="34.5" r="1.4" fill="#1A2E1D"/>
    <Ellipse cx="32" cy="39" rx="2" ry="1.5" fill="rgba(196,149,106,0.7)"/>
    <Circle cx="50" cy="64" r="5" fill="rgba(245,240,232,0.35)" stroke="rgba(140,176,146,0.4)" strokeWidth="1"/>
  </Svg>
);

const PawSVG = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <Ellipse cx="20" cy="26" rx="10" ry="9" fill="rgba(107,143,113,0.35)" stroke="rgba(107,143,113,0.6)" strokeWidth="1.5"/>
    <Circle cx="11" cy="15" r="4.5" fill="rgba(107,143,113,0.35)" stroke="rgba(107,143,113,0.6)" strokeWidth="1.5"/>
    <Circle cx="20" cy="12" r="4.5" fill="rgba(107,143,113,0.35)" stroke="rgba(107,143,113,0.6)" strokeWidth="1.5"/>
    <Circle cx="29" cy="15" r="4.5" fill="rgba(107,143,113,0.35)" stroke="rgba(107,143,113,0.6)" strokeWidth="1.5"/>
    <Circle cx="6"  cy="24" r="3.5" fill="rgba(107,143,113,0.25)" stroke="rgba(107,143,113,0.5)" strokeWidth="1.5"/>
    <Circle cx="34" cy="24" r="3.5" fill="rgba(107,143,113,0.25)" stroke="rgba(107,143,113,0.5)" strokeWidth="1.5"/>
  </Svg>
);

const HeartSVG = () => (
  <Svg width={32} height={32} viewBox="0 0 36 36" fill="none">
    <Path d="M18 30 C18 30 4 22 4 13 C4 8 8 5 12 5 C14.5 5 16.5 6.5 18 8.5 C19.5 6.5 21.5 5 24 5 C28 5 32 8 32 13 C32 22 18 30 18 30Z" fill="rgba(196,149,106,0.3)" stroke="rgba(196,149,106,0.6)" strokeWidth="1.5" strokeLinejoin="round"/>
  </Svg>
);

const MainPawSVG = () => (
  <Svg width={48} height={48} viewBox="0 0 64 64" fill="none">
    <Path d="M32 50c-9 0-17-6.5-19-15a7.5 7.5 0 0 1 4.2-8.5c2.2-1 4.5.2 6.3 2.2l3.5 4.3c2.2 2.7 6.8 2.7 9 0l3.5-4.3c1.8-2 4.1-3.2 6.3-2.2a7.5 7.5 0 0 1 4.2 8.5C48 43.5 41 50 32 50z" fill="#8CB092"/>
    <Circle cx="17" cy="17" r="6.5" fill="#8CB092"/>
    <Circle cx="47" cy="17" r="6.5" fill="#8CB092"/>
    <Circle cx="10.5" cy="31" r="5.8" fill="#8CB092"/>
    <Circle cx="53.5" cy="31" r="5.8" fill="#8CB092"/>
  </Svg>
);

// ─── Single animated animal ───────────────────────────────
const Animal = ({ children, style, delay = 0 }) => {
  const scale    = useRef(new Animated.Value(0)).current;
  const opacity  = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.spring(scale,    { toValue: 1, tension: 60, friction: 8, delay, useNativeDriver: true }),
      Animated.timing(opacity,  { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 60, friction: 8, delay, useNativeDriver: true }),
    ]).start(() => {
      // After entrance: continuous bob
      Animated.loop(
        Animated.sequence([
          Animated.timing(bob, { toValue: -10, duration: 1800, useNativeDriver: true }),
          Animated.timing(bob, { toValue: 0,   duration: 1800, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ scale }, { translateY: Animated.add(translateY, bob) }] }]}>
      {children}
    </Animated.View>
  );
};

// ─── Animated Splash Screen ──────────────────────────────
const SplashLoader = () => {
  const logoScale   = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleTY     = useRef(new Animated.Value(16)).current;
  const loaderWidth = useRef(new Animated.Value(0)).current;

  // Paw step opacities (individual refs — hooks cannot be called in a loop)
  const paw0 = useRef(new Animated.Value(0)).current;
  const paw1 = useRef(new Animated.Value(0)).current;
  const paw2 = useRef(new Animated.Value(0)).current;
  const paw3 = useRef(new Animated.Value(0)).current;
  const paw4 = useRef(new Animated.Value(0)).current;
  const paw5 = useRef(new Animated.Value(0)).current;
  const paws = [paw0, paw1, paw2, paw3, paw4, paw5];

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.spring(logoScale,   { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(titleTY,     { toValue: 0, tension: 55, friction: 8, delay: 150, useNativeDriver: true }),
    ]).start();

    // Loader bar
    Animated.loop(
      Animated.sequence([
        Animated.timing(loaderWidth, { toValue: 1, duration: 2200, useNativeDriver: false }),
        Animated.timing(loaderWidth, { toValue: 0, duration: 0,    useNativeDriver: false }),
      ])
    ).start();

    // Paw steps staggered
    const animatePaw = (paw, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(paw, { toValue: 1, duration: 180,  useNativeDriver: true }),
          Animated.delay(300),
          Animated.timing(paw, { toValue: 0, duration: 250,  useNativeDriver: true }),
          Animated.delay(2200 - delay - 730),
        ])
      );
    paws.forEach((p, i) => animatePaw(p, i * 280).start());
  }, []);

  return (
    <View style={st.splash}>
      <StatusBar barStyle="light-content" />

      {/* Glow circles */}
      <View style={[st.glow, { top: -160, right: -160, width: 360, height: 360 }]} />
      <View style={[st.glow, { bottom: -120, left: -120, width: 300, height: 300 }]} />

      {/* ── Animals ── */}
      <Animal style={st.a1} delay={400}><CatSVG /></Animal>
      <Animal style={st.a2} delay={600}><DogSVG /></Animal>
      <Animal style={st.a3} delay={800}><RabbitSVG /></Animal>
      <Animal style={st.a4} delay={700}><PawSVG size={38} /></Animal>
      <Animal style={st.a5} delay={900}><HeartSVG /></Animal>

      {/* ── Centre ── */}
      <Animated.View style={[st.center, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        {/* Badge icône */}
        <View style={st.badge}>
          <MainPawSVG />
        </View>

        {/* Wordmark */}
        <Animated.View style={{ transform: [{ translateY: titleTY }] }}>
          <Text style={st.title}>
            pépète<Text style={st.titleDot}>.</Text>
          </Text>
          <Text style={st.tagline}>Le meilleur pour vos animaux</Text>
        </Animated.View>

        {/* Loader pattes */}
        <View style={st.pawRow}>
          {paws.map((p, i) => (
            <Animated.View key={i} style={{ opacity: p, transform: [{ scale: Animated.add(0.7, Animated.multiply(p, 0.3)) }] }}>
              <PawSVG size={i % 2 === 0 ? 14 : 12} />
            </Animated.View>
          ))}
        </View>
        <View style={st.loaderTrack}>
          <Animated.View style={[st.loaderFill, {
            width: loaderWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]} />
        </View>
      </Animated.View>
    </View>
  );
};

const st = StyleSheet.create({
  splash: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#1A2E1D', overflow: 'hidden',
  },
  glow: {
    position: 'absolute', borderRadius: 999,
    backgroundColor: 'rgba(107,143,113,0.1)',
  },
  // Animal positions
  a1: { position: 'absolute', top:  '10%', left:  '4%'  },
  a2: { position: 'absolute', top:  '6%',  right: '2%'  },
  a3: { position: 'absolute', bottom: '15%', left: '3%' },
  a4: { position: 'absolute', bottom: '10%', right: '5%' },
  a5: { position: 'absolute', top:  '44%', right: '4%'  },

  // Centre
  center: { alignItems: 'center', zIndex: 2 },
  badge: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: 'rgba(107,143,113,0.18)',
    borderWidth: 1.5, borderColor: 'rgba(107,143,113,0.35)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#6B8F71', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 24, elevation: 8,
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 58, color: '#F5F0E8',
    letterSpacing: -2, lineHeight: 62,
    textAlign: 'center', marginBottom: 8,
  },
  titleDot: { color: '#8CB092' },
  tagline: {
    fontSize: 12, color: 'rgba(245,240,232,0.5)',
    letterSpacing: 2.5, textTransform: 'uppercase',
    textAlign: 'center', marginBottom: 40,
    fontWeight: '500',
  },
  pawRow: {
    flexDirection: 'row', gap: 6, alignItems: 'center',
    marginBottom: 10,
  },
  loaderTrack: {
    width: 120, height: 2,
    backgroundColor: 'rgba(107,143,113,0.2)', borderRadius: 1,
    overflow: 'hidden',
  },
  loaderFill: {
    height: '100%', borderRadius: 1,
    backgroundColor: '#8CB092',
  },
});

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
          // On web, always reset to Tabs>Accueil to ignore any saved /login URL
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

const styles = StyleSheet.create({});

export default AppNavigator;
