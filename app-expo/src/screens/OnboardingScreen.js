import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  Platform, Animated, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../components/Button';
const colors = require('../utils/colors');
const { RADIUS, SHADOWS } = require('../utils/colors');

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    icon: '🐾',
    title: 'Bienvenue sur Patoune',
    subtitle: 'Le compagnon de vos compagnons',
    desc: 'Tout ce dont vous avez besoin pour prendre soin de vos animaux, au meme endroit.',
    bg: ['#FF6B35', '#FF8F65'],
  },
  {
    icon: '📷',
    title: 'Scannez les produits',
    subtitle: 'Verifiez ce que mange votre animal',
    desc: 'Scannez le code-barres de n\'importe quel produit pour connaitre son score nutritionnel et ses ingredients.',
    bg: ['#2ECC71', '#58D68D'],
  },
  {
    icon: '🏠',
    title: 'Trouvez un gardien',
    subtitle: 'Des gardiens de confiance pres de chez vous',
    desc: 'Reservez un gardien certifie pour votre animal quand vous en avez besoin. Messagerie integree.',
    bg: ['#5B5BD6', '#8B8BF5'],
  },
  {
    icon: '🤖',
    title: 'Assistant IA',
    subtitle: 'Posez vos questions',
    desc: 'Un assistant intelligent pour repondre a toutes vos questions sur la sante et le bien-etre de vos animaux.',
    bg: ['#E55A25', '#FF8F65'],
  },
];

const OnboardingScreen = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const goToSlide = (index) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setCurrentSlide(index);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ]).start();
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

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  return (
    <LinearGradient colors={slide.bg} style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>{slide.icon}</Text>
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
        <Text style={styles.desc}>{slide.desc}</Text>
      </Animated.View>

      {/* Dots + CTA */}
      <View style={styles.bottom}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goToSlide(i)}>
              <View style={[styles.dot, currentSlide === i && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title={isLast ? "C'est parti !" : 'Suivant'}
          onPress={handleNext}
          size="lg"
          icon={isLast ? '🚀' : '→'}
          style={styles.ctaBtn}
          variant="secondary"
          textStyle={{ color: slide.bg[0] }}
        />

        {Platform.OS === 'web' && (
          <Text style={styles.pwaHint}>
            Ajoutez Patoune a votre ecran d'accueil pour un acces rapide
          </Text>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 44,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  skipText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  iconEmoji: {
    fontSize: 56,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  desc: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: '#FFF',
    width: 28,
    borderRadius: 5,
  },
  ctaBtn: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: RADIUS.lg,
  },
  pwaHint: {
    marginTop: 16,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
});

export default OnboardingScreen;
