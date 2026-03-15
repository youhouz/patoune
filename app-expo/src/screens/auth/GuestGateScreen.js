import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, Animated, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { PawIcon } from '../../components/Logo';
import { FONTS } from '../../utils/typography';
const colors = require('../../utils/colors');
const { RADIUS, SHADOWS, SPACING, FONT_SIZE } = require('../../utils/colors');

const FEATURES = [
  { icon: 'heart', title: 'Trouvez un Pet-sitter', desc: 'Des Pet-sitters vérifiés près de chez vous pour vos animaux.' },
  { icon: 'camera', title: 'Historique des scans', desc: 'Retrouvez tous vos produits analysés en un clin d\'œil.' },
  { icon: 'users', title: 'Profil de vos animaux', desc: 'Enregistrez vos compagnons pour des conseils personnalisés.' },
  { icon: 'message-circle', title: 'Messagerie', desc: 'Communiquez directement avec les pet-sitters.' },
];

const GuestGateScreen = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Header */}
          <View style={s.hero}>
            <LinearGradient
              colors={['#1C2B1E', '#2C3E2F', '#3D5E41']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[s.heroGrad, { paddingTop: insets.top + 20 }]}
            >
              <View style={s.heroOrb1} />
              <View style={s.heroOrb2} />
              <TouchableOpacity
                style={s.backButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Feather name="chevron-left" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={{ height: SPACING.base }} />
              <View style={s.logoBadge}>
                <PawIcon size={28} color="#FFF" />
              </View>
              <Text style={s.logoWord}>pépète.</Text>
              <Text style={s.heroTitle}>Créez votre compte</Text>
              <Text style={s.heroSubtitle}>
                Débloquez toutes les fonctionnalités gratuitement
              </Text>
            </LinearGradient>
          </View>

          {/* Feature list */}
          <View style={s.features}>
            <Text style={s.featuresTitle}>Ce qui vous attend</Text>
            {FEATURES.map((f, i) => (
              <View key={i} style={s.featureRow}>
                <View style={s.featureIconWrap}>
                  <Feather name={f.icon} size={20} color={colors.primary} />
                </View>
                <View style={s.featureText}>
                  <Text style={s.featureTitle}>{f.title}</Text>
                  <Text style={s.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* CTA buttons */}
          <View style={s.ctas}>
            <TouchableOpacity
              style={s.ctaPrimary}
              onPress={() => navigation.navigate('AuthStack', { screen: 'Register' })}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colors.primaryDark, colors.primary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.ctaPrimaryGrad}
              >
                <Text style={s.ctaPrimaryText}>Créer un compte gratuit</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.ctaSecondary}
              onPress={() => navigation.navigate('AuthStack', { screen: 'Login' })}
              activeOpacity={0.7}
            >
              <Text style={s.ctaSecondaryText}>J'ai déjà un compte</Text>
            </TouchableOpacity>
          </View>

          {/* Subtle note */}
          <Text style={s.note}>
            Le scanner et l'assistant IA restent accessibles sans compte 😉
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  content: { flex: 1, paddingBottom: 40 },

  hero: { marginBottom: 28 },
  heroGrad: {
    paddingTop: 20, // dynamic insets applied via style prop
    paddingBottom: 40,
    paddingHorizontal: SPACING.xl,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    alignItems: 'center',
    overflow: 'hidden',
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOrb1: {
    position: 'absolute', top: -50, right: -50,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroOrb2: {
    position: 'absolute', bottom: -40, left: -30,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  logoBadge: {
    width: 56, height: 56,
    borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
  },
  logoWord: {
    fontFamily: FONTS.brand,
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SPACING.lg,
  },
  heroTitle: {
    fontFamily: FONTS.brand,
    fontSize: FONT_SIZE['3xl'],
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: FONT_SIZE.base,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    fontWeight: '500',
  },

  features: { paddingHorizontal: SPACING.xl, marginBottom: 32 },
  featuresTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  featureIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  ctas: { paddingHorizontal: SPACING.xl },
  ctaPrimary: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: 12,
    ...(typeof SHADOWS.glow === 'function' ? SHADOWS.glow(colors.primary) : {}),
  },
  ctaPrimaryGrad: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  },
  ctaPrimaryText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.2,
  },
  ctaSecondary: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    backgroundColor: colors.primarySoft,
  },
  ctaSecondaryText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: colors.primary,
  },

  note: {
    marginTop: 24,
    fontSize: FONT_SIZE.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});

export default GuestGateScreen;
