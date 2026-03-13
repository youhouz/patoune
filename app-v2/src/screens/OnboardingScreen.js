// ─────────────────────────────────────────────────────────────────────────────
// Pepete — OnboardingScreen v3.0
// DA : Apple x pepete brand — creme chaud, vert sauge, typographie Display
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  StatusBar,
  Dimensions,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { PepeteIcon } from '../components/PepeteLogo';

const { width, height } = Dimensions.get('window');

// ─── Brand palette ────────────────────────────────────────
const C = {
  bg:          '#FAF6EE',
  surface:     '#FFFFFF',
  primary:     '#6B8F71',
  primaryDark: '#527A56',
  primaryLight:'#8CB092',
  text:        '#1C2B1E',
  textSec:     '#6B7E6E',
  border:      '#E8E2D8',
};

// ─── Slides ───────────────────────────────────────────────
const SLIDES = [
  {
    key: 'welcome',
    eyebrow: 'BIENVENUE',
    title: 'Le meilleur\npour vos\nanimaux.',
    desc: "Tout ce qu'il faut pour prendre soin de vos compagnons, au même endroit.",
    blobColors: ['#527A56', '#6B8F71', '#8CB092'],
    heroIcon: null,
    trust: [
      { icon: 'check-circle', label: 'Simple' },
      { icon: 'zap',          label: 'Rapide' },
      { icon: 'shield',       label: 'Fiable' },
    ],
    features: null,
  },
  {
    key: 'scanner',
    eyebrow: 'SCANNER',
    title: 'Scannez\nles produits.',
    desc: "Vérifiez la qualité de ce que mange votre animal en scannant le code-barres.",
    blobColors: ['#3D7A5F', '#527A56', '#6B8F71'],
    heroIcon: 'maximize',
    trust: null,
    features: [
      { icon: 'bar-chart-2',    text: 'Score nutritionnel de 0 à 100' },
      { icon: 'alert-triangle', text: 'Ingrédients suspects détectés' },
      { icon: 'database',       text: '50 000+ produits analysés' },
      { icon: 'clock',          text: 'Résultat en moins de 2 secondes' },
    ],
  },
  {
    key: 'garde',
    eyebrow: 'GARDE & PROMENADE',
    title: 'Trouvez un\ngardien\nde confiance.',
    desc: "Des gardiens vérifiés près de chez vous. Réservation simple, paiement sécurisé.",
    blobColors: ['#527A56', '#6B8F71', '#96A88A'],
    heroIcon: 'home',
    trust: null,
    features: [
      { icon: 'shield',         text: 'Gardiens vérifiés & certifiés' },
      { icon: 'calendar',       text: 'Réservation en quelques clics' },
      { icon: 'message-circle', text: 'Messagerie intégrée' },
      { icon: 'map-pin',        text: 'Services proches de chez vous' },
    ],
  },
  {
    key: 'ia',
    eyebrow: 'ASSISTANT IA',
    title: 'Posez toutes\nvos questions\nde santé.',
    desc: "Un assistant intelligent disponible 24h/24, conçu pour vos compagnons.",
    blobColors: ['#5E6D53', '#6B8F71', '#8CB092'],
    heroIcon: 'message-circle',
    trust: null,
    features: [
      { icon: 'help-circle',  text: 'Questions santé & comportement' },
      { icon: 'zap',          text: 'Réponses instantanées 24/7' },
      { icon: 'heart',        text: 'Conseils personnalisés par animal' },
      { icon: 'lock',         text: 'Données privées & sécurisées' },
    ],
  },
];

// ─── Feature Row ──────────────────────────────────────────
const FeatureRow = ({ icon, text, delay }) => {
  const anim  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(14)).current;
  useEffect(() => {
    anim.setValue(0);
    slide.setValue(14);
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(anim,  { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.spring(slide, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, [text, delay, anim, slide]);
  return (
    <Animated.View style={[styles.featureRow, { opacity: anim, transform: [{ translateY: slide }] }]}>
      <View style={styles.featIconWrap}>
        <Feather name={icon} size={17} color={C.primary} />
      </View>
      <Text style={styles.featText}>{text}</Text>
    </Animated.View>
  );
};

// ─── Trust Pill ───────────────────────────────────────────
const TrustPill = ({ icon, label, delay }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    anim.setValue(0);
    const t = setTimeout(() => Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }).start(), delay);
    return () => clearTimeout(t);
  }, [delay, anim]);
  return (
    <Animated.View style={[styles.trustPill, { opacity: anim }]}>
      <Feather name={icon} size={14} color={C.primaryDark} />
      <Text style={styles.trustPillText}>{label}</Text>
    </Animated.View>
  );
};

// ─── Main ─────────────────────────────────────────────────
const OnboardingScreen = ({ onComplete }) => {
  const insets = useSafeAreaInsets();
  const [currentSlide, setCurrentSlide] = useState(0);

  const cardFade   = useRef(new Animated.Value(0)).current;
  const cardSlide  = useRef(new Animated.Value(0)).current;
  const iconScale  = useRef(new Animated.Value(0.72)).current;
  const titleFade  = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(18)).current;
  const btnScale   = useRef(new Animated.Value(1)).current;
  const blobFloat  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardFade, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.spring(iconScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(titleFade, { toValue: 1, duration: 480, delay: 180, useNativeDriver: true }),
      Animated.spring(titleSlide, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(blobFloat, { toValue: 1, duration: 4800, useNativeDriver: true }),
        Animated.timing(blobFloat, { toValue: 0, duration: 4800, useNativeDriver: true }),
      ])
    ).start();
  }, [cardFade, iconScale, titleFade, titleSlide, blobFloat]);

  const goToSlide = useCallback((idx) => {
    Animated.parallel([
      Animated.timing(cardFade, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(titleFade, { toValue: 0, duration: 110, useNativeDriver: true }),
      Animated.timing(iconScale, { toValue: 0.75, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setCurrentSlide(idx);
      cardSlide.setValue(26);
      titleSlide.setValue(18);
      Animated.parallel([
        Animated.timing(cardFade,   { toValue: 1, duration: 360, useNativeDriver: true }),
        Animated.spring(cardSlide,  { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
        Animated.spring(iconScale,  { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
        Animated.timing(titleFade,  { toValue: 1, duration: 380, delay: 80, useNativeDriver: true }),
        Animated.spring(titleSlide, { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
      ]).start();
    });
  }, [cardFade, cardSlide, iconScale, titleFade, titleSlide]);

  const handleNext = useCallback(() => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.94, duration: 70, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }),
    ]).start();
    if (currentSlide < SLIDES.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  }, [currentSlide, goToSlide, onComplete, btnScale]);

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;
  const BLOB_H = Math.min(height * 0.46, 340);

  const blobY = blobFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" />

      {/* ── BLOB TOP ─── */}
      <Animated.View style={[styles.blobWrap, { height: BLOB_H, transform: [{ translateY: blobY }] }]} pointerEvents="none">
        <LinearGradient colors={slide.blobColors} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.blob}>
          <View style={styles.blobOrb1} />
          <View style={styles.blobOrb2} />
          <Animated.View style={[styles.heroWrap, { transform: [{ scale: iconScale }] }]}>
            {slide.heroIcon === null ? (
              <View style={styles.heroBox}>
                <PepeteIcon size={62} color="#FFF" />
              </View>
            ) : (
              <View style={styles.heroBox}>
                <Feather name={slide.heroIcon} size={46} color="#FFF" />
              </View>
            )}
          </Animated.View>
          {slide.key === 'welcome' && (
            <View style={styles.wordmarkRow}>
              <Text style={styles.wordmark}>pépète.</Text>
              <Text style={styles.wordmarkSub}>Le meilleur pour vos animaux</Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>

      {/* ── SKIP ─── */}
      {!isLast && (
        <TouchableOpacity
          style={[styles.skipBtn, { top: insets.top + 14 }]}
          onPress={onComplete}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      )}

      {/* ── CARD BOTTOM ─── */}
      <Animated.View
        style={[
          styles.card,
          { opacity: cardFade, transform: [{ translateY: cardSlide }], paddingBottom: Math.max(insets.bottom + 20, 36) },
        ]}
      >
        <Text style={styles.eyebrow}>{slide.eyebrow}</Text>

        <Animated.Text style={[styles.title, { opacity: titleFade, transform: [{ translateY: titleSlide }] }]}>
          {slide.title}
        </Animated.Text>

        <Text style={styles.desc}>{slide.desc}</Text>

        {slide.trust && (
          <View style={styles.trustRow}>
            {slide.trust.map((t, i) => (
              <TrustPill key={t.label} icon={t.icon} label={t.label} delay={280 + i * 90} />
            ))}
          </View>
        )}

        {slide.features && (
          <View style={styles.featureList}>
            {slide.features.map((f, i) => (
              <FeatureRow key={f.text} icon={f.icon} text={f.text} delay={190 + i * 75} />
            ))}
          </View>
        )}

        {/* Progress */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <Pressable key={i} onPress={() => i !== currentSlide && goToSlide(i)} hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}>
              <View style={[styles.dot, currentSlide === i ? styles.dotActive : i < currentSlide ? styles.dotDone : styles.dotNext]} />
            </Pressable>
          ))}
        </View>

        {/* CTA */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity onPress={handleNext} activeOpacity={1} style={styles.ctaWrap}>
            <LinearGradient colors={['#527A56', '#6B8F71']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
              <Text style={styles.ctaText}>{isLast ? "C'est parti !" : 'Continuer'}</Text>
              <View style={styles.ctaArrow}>
                <Feather name={isLast ? 'check' : 'arrow-right'} size={19} color={C.primary} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {Platform.OS === 'web' && currentSlide === 0 && (
          <Text style={styles.pwaHint}>Installez Pépète sur votre écran d'accueil</Text>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Blob
  blobWrap: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  blob: { flex: 1, borderBottomLeftRadius: 44, borderBottomRightRadius: 44, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 28 },
  blobOrb1: { position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.07)' },
  blobOrb2: { position: 'absolute', bottom: 20, left: -50, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.05)' },
  heroWrap: { marginBottom: 14 },
  heroBox: {
    width: 104, height: 104, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.22)',
  },
  wordmarkRow: { alignItems: 'center' },
  wordmark: { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: -0.5, marginBottom: 3 },
  wordmarkSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },

  // Skip
  skipBtn: {
    position: 'absolute', right: 22, zIndex: 20,
    paddingVertical: 9, paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  skipText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  // Card
  card: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36, borderTopRightRadius: 36,
    paddingTop: 26, paddingHorizontal: 26,
    shadowColor: '#2C3E2F', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.07, shadowRadius: 20, elevation: 8,
  },

  // Typography
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 2.5, color: '#6B8F71', marginBottom: 8, textTransform: 'uppercase' },
  title: {
    fontSize: Platform.OS === 'web' ? 40 : 37,
    fontWeight: '900', color: '#1C2B1E',
    letterSpacing: -1.5, lineHeight: Platform.OS === 'web' ? 46 : 43,
    marginBottom: 12,
  },
  desc: { fontSize: 15, color: '#6B7E6E', lineHeight: 23, fontWeight: '400', marginBottom: 18 },

  // Trust
  trustRow: { flexDirection: 'row', gap: 8, marginBottom: 22, flexWrap: 'wrap' },
  trustPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14,
    backgroundColor: '#EFF5F0', borderRadius: 99,
    borderWidth: 1, borderColor: '#D4E5D6',
  },
  trustPillText: { fontSize: 13, fontWeight: '700', color: '#527A56', letterSpacing: 0.1 },

  // Features
  featureList: { gap: 11, marginBottom: 22 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#EFF5F0', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#D4E5D6',
  },
  featText: { fontSize: 15, fontWeight: '600', color: '#1C2B1E', flex: 1, letterSpacing: -0.1 },

  // Dots
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 18, alignItems: 'center' },
  dot: { height: 7, borderRadius: 4 },
  dotActive: { width: 26, backgroundColor: '#6B8F71' },
  dotDone: { width: 7, backgroundColor: '#D4E5D6' },
  dotNext: { width: 7, backgroundColor: '#E8E2D8' },

  // CTA
  ctaWrap: { borderRadius: 18, overflow: 'hidden', shadowColor: '#527A56', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.26, shadowRadius: 14, elevation: 8 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 60, borderRadius: 18, gap: 10 },
  ctaText: { fontSize: 17, fontWeight: '800', color: '#FFF', letterSpacing: 0.1 },
  ctaArrow: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },

  pwaHint: { marginTop: 12, fontSize: 12, color: '#6B7E6E', textAlign: 'center' },
});

export default OnboardingScreen;
