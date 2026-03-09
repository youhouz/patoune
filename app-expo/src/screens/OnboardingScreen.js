import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  Platform, Animated, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PepeteLogo, { PepeteIcon } from '../components/PepeteLogo';
const colors = require('../utils/colors');
const { RADIUS, SHADOWS } = require('../utils/colors');

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    icon: null,
    customIcon: true,
    title: 'Bienvenue sur\nPépète',
    subtitle: 'Le compagnon de vos compagnons',
    desc: 'Tout ce dont vous avez besoin pour prendre soin de vos animaux, au meme endroit.',
    bg: ['#5E6D53', '#7B8B6F', '#96A88A'],
    featureIcon: '✨',
    featureText: 'Application #1 pour les proprietaires',
  },
  {
    icon: '📷',
    title: 'Scannez les\nproduits',
    subtitle: 'Verifiez ce que mange votre animal',
    desc: 'Scannez le code-barres de n\'importe quel produit pour connaitre son score nutritionnel et ses ingredients.',
    bg: ['#1FA855', '#2ECC71', '#58D68D'],
    featureIcon: '🔬',
    featureText: 'Analyse detaillee des ingredients',
  },
  {
    icon: '🏠',
    title: 'Trouvez un\ngardien',
    subtitle: 'Des gardiens de confiance pres de chez vous',
    desc: 'Reservez un gardien certifie pour votre animal quand vous en avez besoin. Messagerie integree.',
    bg: ['#3D7A5F', '#4ECBA0', '#7DDBB8'],
    featureIcon: '🛡️',
    featureText: 'Gardiens verifies et certifies',
  },
  {
    icon: '🤖',
    title: 'Assistant\nIA',
    subtitle: 'Posez vos questions',
    desc: 'Un assistant intelligent pour repondre a toutes vos questions sur la sante et le bien-etre de vos animaux.',
    bg: ['#5E6D53', '#5E6D53', '#96A88A'],
    featureIcon: '🧠',
    featureText: 'Reponses instantanees 24/7',
  },
];

const OnboardingScreen = ({ onComplete }) => {
  const insets = useSafeAreaInsets();
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const slideYAnim = useRef(new Animated.Value(30)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const ctaSlide = useRef(new Animated.Value(20)).current;
  const ctaBtnScale = useRef(new Animated.Value(1)).current;
  const featureFade = useRef(new Animated.Value(0)).current;

  // Floating orbs
  const orbFloat1 = useRef(new Animated.Value(0)).current;
  const orbFloat2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial entrance
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
        Animated.spring(slideYAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(ctaFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(ctaSlide, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
      Animated.timing(featureFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Floating orb loops
    const floatLoop = (anim, duration) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
        ])
      ).start();
    };
    floatLoop(orbFloat1, 4500);
    floatLoop(orbFloat2, 6000);
  }, []);

  const goToSlide = (index) => {
    // Exit
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.88, duration: 140, useNativeDriver: true }),
      Animated.timing(featureFade, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      setCurrentSlide(index);
      slideYAnim.setValue(25);
      // Enter
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.spring(slideYAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]).start();
      Animated.timing(featureFade, { toValue: 1, duration: 400, delay: 150, useNativeDriver: true }).start();
    });
  };

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const animateButtonPress = (callback) => {
    Animated.sequence([
      Animated.timing(ctaBtnScale, { toValue: 0.94, duration: 70, useNativeDriver: true }),
      Animated.spring(ctaBtnScale, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }),
    ]).start();
    callback();
  };

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  const orbTranslate1 = orbFloat1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15],
  });
  const orbTranslate2 = orbFloat2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Full-screen gradient */}
      <LinearGradient
        colors={slide.bg}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated floating orbs */}
      <View style={styles.orbContainer}>
        <Animated.View style={[styles.orb, styles.orb1, { transform: [{ translateY: orbTranslate1 }] }]} />
        <Animated.View style={[styles.orb, styles.orb2, { transform: [{ translateY: orbTranslate2 }] }]} />
        <View style={[styles.orb, styles.orb3]} />
      </View>

      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity style={[styles.skipBtn, { top: insets.top + 12 }]} onPress={handleSkip} activeOpacity={0.7}>
          <View style={styles.skipInner}>
            <Text style={styles.skipText}>Passer</Text>
            <Text style={styles.skipArrow}>{' \u203A'}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Main content */}
      <View style={styles.contentArea}>
        <Animated.View style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: slideYAnim }],
          },
        ]}>
          {/* Icon with glass circle */}
          <View style={styles.iconOuter}>
            {slide.customIcon ? (
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <PepeteIcon size={72} color="#FFFFFF" />
              </View>
            ) : (
              <LinearGradient
                colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.08)']}
                style={styles.iconCircle}
              >
                <Text style={styles.iconEmoji}>{slide.icon}</Text>
              </LinearGradient>
            )}
          </View>

          <Text style={styles.title}>{slide.title}</Text>

          <View style={styles.subtitleWrap}>
            <View style={styles.subtitleLine} />
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
            <View style={styles.subtitleLine} />
          </View>

          <Text style={styles.desc}>{slide.desc}</Text>

          {/* Feature badge */}
          <Animated.View style={[styles.featureBadge, { opacity: featureFade }]}>
            <Text style={styles.featureBadgeIcon}>{slide.featureIcon}</Text>
            <Text style={styles.featureBadgeText}>{slide.featureText}</Text>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Bottom section */}
      <Animated.View style={[
        styles.bottom,
        { paddingBottom: Math.max(insets.bottom, 20) },
        {
          opacity: ctaFade,
          transform: [{ translateY: ctaSlide }],
        },
      ]}>
        {/* Premium dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goToSlide(i)} hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}>
              <View style={[styles.dot, currentSlide === i && styles.dotActive]}>
                {currentSlide === i && <View style={styles.dotInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Premium CTA button */}
        <Animated.View style={{ transform: [{ scale: ctaBtnScale }], width: '100%' }}>
          <TouchableOpacity
            onPress={() => animateButtonPress(handleNext)}
            activeOpacity={1}
          >
            <View style={styles.ctaBtn}>
              <View style={styles.ctaBtnContent}>
                <Text style={[styles.ctaBtnText, { color: slide.bg[0] }]}>
                  {isLast ? "C'est parti !" : 'Suivant'}
                </Text>
                <View style={[styles.ctaBtnArrowWrap, { backgroundColor: slide.bg[0] + '18' }]}>
                  <Text style={[styles.ctaBtnArrow, { color: slide.bg[0] }]}>
                    {isLast ? '🚀' : '\u2192'}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Trust indicators on first slide */}
        {currentSlide === 0 && (
          <Animated.View style={[styles.trustRow, { opacity: featureFade }]}>
            <View style={styles.trustItem}>
              <Text style={styles.trustNumber}>2 000+</Text>
              <Text style={styles.trustLabel}>Utilisateurs</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Text style={styles.trustNumber}>4.9 ★</Text>
              <Text style={styles.trustLabel}>Note moyenne</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Text style={styles.trustNumber}>100%</Text>
              <Text style={styles.trustLabel}>Gratuit</Text>
            </View>
          </Animated.View>
        )}

        {Platform.OS === 'web' && (
          <Text style={styles.pwaHint}>
            Ajoutez Pépète a votre ecran d'accueil pour un acces rapide
          </Text>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Orbs
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 300,
    height: 300,
    top: -80,
    right: -80,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  orb2: {
    width: 220,
    height: 220,
    bottom: 150,
    left: -80,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  orb3: {
    width: 160,
    height: 160,
    top: height * 0.35,
    right: -40,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  // Skip
  skipBtn: {
    position: 'absolute',
    top: 12, // dynamic insets applied via style prop
    right: 24,
    zIndex: 10,
  },
  skipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  skipText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
  skipArrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    fontWeight: '600',
  },
  // Content
  contentArea: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  iconOuter: {
    marginBottom: 32,
    ...SHADOWS.lg,
    shadowColor: 'rgba(0,0,0,0.2)',
  },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  iconEmoji: {
    fontSize: 58,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 16,
    lineHeight: 44,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  subtitleLine: {
    width: 24,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 1,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    marginHorizontal: 12,
    letterSpacing: 0.3,
  },
  desc: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 25,
    maxWidth: 320,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  featureBadgeIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  featureBadgeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // Bottom
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 32, // dynamic handled by insets if needed
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: 'transparent',
    width: 36,
    borderRadius: 8,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  dotInner: {
    width: '80%',
    height: '60%',
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  // CTA
  ctaBtn: {
    width: '100%',
    height: 64,
    backgroundColor: '#FFF',
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
    shadowColor: 'rgba(0,0,0,0.15)',
  },
  ctaBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaBtnText: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginRight: 10,
  },
  ctaBtnArrowWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnArrow: {
    fontSize: 17,
    fontWeight: '700',
  },
  // Trust indicators
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    paddingHorizontal: 8,
  },
  trustItem: {
    alignItems: 'center',
    flex: 1,
  },
  trustNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.3,
  },
  trustLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  trustDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  pwaHint: {
    marginTop: 16,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
});

export default OnboardingScreen;
