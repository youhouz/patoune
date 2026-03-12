// ═══════════════════════════════════════════════════════════════════════════
// Pépète v7.0 — OnboardingScreen (Dark Premium 2027)
// Design: Apple Intelligence × Revolut × Arc Browser
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  Platform, Animated, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { PepeteIcon } from '../components/PepeteLogo';
const { COLORS, RADIUS } = require('../utils/colors');

const { width, height } = Dimensions.get('window');

// ─── Slides — bold, short, premium ───────────────────────────────────────
const SLIDES = [
  {
    id: 'welcome',
    eyebrow: 'BIENVENUE',
    title: 'Pépète',
    desc: 'Le compagnon intelligent de vos animaux. Créé avec amour, conçu pour durer.',
    accent: '#00E676',
    glow: 'rgba(0,230,118,0.20)',
    orb1: '#00E676',
    orb2: '#00BFA5',
    icon: null, // logo
    feature: { icon: 'star', text: '4.9 · Gratuit · 2 000+ utilisateurs' },
  },
  {
    id: 'scanner',
    eyebrow: 'SCANNER',
    title: 'Analysez\ntout.',
    desc: 'Scannez n\'importe quel produit. Score nutritionnel, ingrédients, allergènes — en 1 seconde.',
    accent: '#22D3EE',
    glow: 'rgba(34,211,238,0.20)',
    orb1: '#22D3EE',
    orb2: '#0EA5E9',
    icon: 'camera',
    feature: { icon: 'zap', text: 'Analyse IA instantanée' },
  },
  {
    id: 'petsitting',
    eyebrow: 'GARDE',
    title: 'Des gardiens\nde confiance.',
    desc: 'Réservez des gardiens vérifiés près de chez vous. Messagerie intégrée, paiement sécurisé.',
    accent: '#A78BFA',
    glow: 'rgba(167,139,250,0.20)',
    orb1: '#A78BFA',
    orb2: '#7C3AED',
    icon: 'shield',
    feature: { icon: 'check-circle', text: 'Gardiens certifiés & assurés' },
  },
  {
    id: 'ai',
    eyebrow: 'ASSISTANT IA',
    title: 'Votre véto\nà portée.',
    desc: 'Posez toutes vos questions. Notre IA répond 24h/24 sur la santé et le bien-être de vos animaux.',
    accent: '#FBBF24',
    glow: 'rgba(251,191,36,0.20)',
    orb1: '#FBBF24',
    orb2: '#F59E0B',
    icon: 'message-circle',
    feature: { icon: 'clock', text: 'Disponible 24h/24 · 7j/7' },
  },
];

const OnboardingScreen = ({ onComplete }) => {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);

  // Animations
  const fade    = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(40)).current;
  const scale   = useRef(new Animated.Value(0.92)).current;
  const btnScale= useRef(new Animated.Value(1)).current;
  const orb1Y   = useRef(new Animated.Value(0)).current;
  const orb2Y   = useRef(new Animated.Value(0)).current;
  const progress= useRef(new Animated.Value(0)).current;

  const enterAnim = () => {
    fade.setValue(0);
    slideY.setValue(36);
    scale.setValue(0.93);
    Animated.parallel([
      Animated.timing(fade,   { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
      Animated.spring(scale,  { toValue: 1, tension: 60, friction: 9, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    enterAnim();
    // Floating orbs loop
    const loop = (anim, dur) => Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: dur, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: dur, useNativeDriver: true }),
    ])).start();
    loop(orb1Y, 5000);
    loop(orb2Y, 7000);
  }, []);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: current / (SLIDES.length - 1),
      duration: 380,
      useNativeDriver: false,
    }).start();
  }, [current]);

  const goTo = (idx) => {
    Animated.parallel([
      Animated.timing(fade,   { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: -20, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setCurrent(idx);
      enterAnim();
    });
  };

  const pressBtn = () => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }),
    ]).start();
    if (current < SLIDES.length - 1) goTo(current + 1);
    else onComplete();
  };

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const orb1Translate = orb1Y.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });
  const orb2Translate = orb2Y.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={[styles.root, { backgroundColor: COLORS.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Ambient glow orbs ─────────────────────────────── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View style={[styles.orb, styles.orb1, {
          backgroundColor: slide.glow,
          transform: [{ translateY: orb1Translate }],
        }]} />
        <Animated.View style={[styles.orb, styles.orb2, {
          backgroundColor: slide.glow,
          transform: [{ translateY: orb2Translate }],
        }]} />
        {/* Radial spotlight from top */}
        <LinearGradient
          colors={[slide.glow, 'transparent']}
          style={styles.spotlight}
          pointerEvents="none"
        />
      </View>

      {/* ── Content ──────────────────────────────────────── */}
      <View style={[styles.body, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}>

        {/* Skip */}
        {!isLast && (
          <TouchableOpacity style={styles.skipBtn} onPress={() => onComplete()} activeOpacity={0.7}>
            <Text style={styles.skipText}>Passer</Text>
            <Feather name="chevron-right" size={14} color={COLORS.textTertiary} />
          </TouchableOpacity>
        )}

        {/* Slide content */}
        <Animated.View style={[styles.slideContent, { opacity: fade, transform: [{ translateY: slideY }, { scale }] }]}>

          {/* ── Eyebrow ── */}
          <View style={[styles.eyebrowPill, { borderColor: slide.accent + '40', backgroundColor: slide.accent + '10' }]}>
            <Text style={[styles.eyebrow, { color: slide.accent }]}>{slide.eyebrow}</Text>
          </View>

          {/* ── Icon ── */}
          <View style={[styles.iconWrap, { shadowColor: slide.accent, shadowOpacity: 0.5, shadowRadius: 40, shadowOffset: { width: 0, height: 0 } }]}>
            <LinearGradient
              colors={[slide.orb1 + '20', slide.orb2 + '10']}
              style={[styles.iconGlass, { borderColor: slide.accent + '25' }]}
            >
              {slide.icon === null ? (
                <PepeteIcon size={72} color={slide.accent} />
              ) : (
                <Feather name={slide.icon} size={52} color={slide.accent} />
              )}
            </LinearGradient>
          </View>

          {/* ── Title ── */}
          <Text style={styles.title}>{slide.title}</Text>

          {/* ── Description ── */}
          <Text style={styles.desc}>{slide.desc}</Text>

          {/* ── Feature badge ── */}
          <View style={[styles.featureBadge, { borderColor: slide.accent + '20', backgroundColor: slide.accent + '08' }]}>
            <Feather name={slide.feature.icon} size={13} color={slide.accent} />
            <Text style={[styles.featureText, { color: slide.accent }]}>{slide.feature.text}</Text>
          </View>

        </Animated.View>

        {/* ── Bottom bar ── */}
        <View style={styles.bottomBar}>

          {/* Progress track */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: slide.accent }]} />
          </View>

          {/* Dots */}
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => goTo(i)} hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}>
                <Animated.View style={[
                  styles.dot,
                  { backgroundColor: i === current ? slide.accent : COLORS.glassBorder,
                    width: i === current ? 28 : 8 },
                ]} />
              </TouchableOpacity>
            ))}
          </View>

          {/* CTA */}
          <Animated.View style={{ transform: [{ scale: btnScale }], width: '100%' }}>
            <TouchableOpacity onPress={pressBtn} activeOpacity={0.9} style={styles.ctaWrap}>
              <LinearGradient
                colors={[slide.orb1, slide.orb2]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.ctaBtn}
              >
                <Text style={styles.ctaText}>
                  {isLast ? "Commencer — C'est gratuit" : 'Continuer'}
                </Text>
                <View style={styles.ctaArrow}>
                  <Feather name={isLast ? 'arrow-right' : 'chevron-right'} size={20} color="#080B12" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Trust row — first slide only */}
          {current === 0 && (
            <View style={styles.trustRow}>
              {[['★ 4.9', 'Note'], ['2 000+', 'Utilisateurs'], ['100%', 'Gratuit']].map(([n, l], i) => (
                <React.Fragment key={i}>
                  {i > 0 && <View style={styles.trustDiv} />}
                  <View style={styles.trustItem}>
                    <Text style={styles.trustNum}>{n}</Text>
                    <Text style={styles.trustLabel}>{l}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 24 },

  // --- Orbs ---
  orb: { position: 'absolute', borderRadius: 999 },
  orb1: { width: 400, height: 400, top: -120, right: -120 },
  orb2: { width: 300, height: 300, bottom: 100, left: -100 },
  spotlight: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: height * 0.55,
    opacity: 0.6,
  },

  // --- Skip ---
  skipBtn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 8,
  },
  skipText: { color: COLORS.textTertiary, fontSize: 13, fontWeight: '500' },

  // --- Slide content ---
  slideContent: { flex: 1, justifyContent: 'center', paddingTop: 20 },

  eyebrowPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    marginBottom: 32,
  },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 2 },

  iconWrap: { marginBottom: 32, alignSelf: 'flex-start' },
  iconGlass: {
    width: 120,
    height: 120,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  title: {
    fontSize: 52,
    fontWeight: '900',
    color: COLORS.text,
    lineHeight: 58,
    letterSpacing: -2.5,
    marginBottom: 20,
  },
  desc: {
    fontSize: 17,
    color: COLORS.textSecondary,
    lineHeight: 26,
    marginBottom: 28,
    fontWeight: '400',
    maxWidth: 320,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  featureText: { fontSize: 13, fontWeight: '600' },

  // --- Bottom ---
  bottomBar: { paddingTop: 24 },

  progressTrack: {
    height: 2,
    backgroundColor: COLORS.glassBorder,
    borderRadius: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: { height: 2, borderRadius: 1 },

  dotsRow: { flexDirection: 'row', gap: 6, marginBottom: 24 },
  dot: { height: 8, borderRadius: 4 },

  ctaWrap: { width: '100%' },
  ctaBtn: {
    height: 62,
    borderRadius: RADIUS.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  ctaText: { fontSize: 17, fontWeight: '800', color: '#080B12', letterSpacing: -0.3 },
  ctaArrow: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(8,11,18,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    gap: 0,
  },
  trustItem: { flex: 1, alignItems: 'center' },
  trustNum: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  trustLabel: { fontSize: 11, color: COLORS.textTertiary, fontWeight: '500' },
  trustDiv: { width: 1, height: 30, backgroundColor: COLORS.glassBorder },
});

export default OnboardingScreen;
