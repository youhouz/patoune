import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors, { SHADOWS, RADIUS, SPACING, FONT_SIZE } from '../../utils/colors';

const HEADER_PADDING_TOP = Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12;

const STEPS_IOS = [
  {
    number: '1',
    icon: 'compass',
    title: 'Ouvrir Safari',
    description: 'Ouvrez le site pepete dans Safari (pas Chrome ni Firefox, ca ne marche que dans Safari sur iPhone/iPad).',
  },
  {
    number: '2',
    icon: 'share',
    title: 'Appuyer sur le bouton Partager',
    description: 'En bas de l\'ecran (iPhone) ou en haut (iPad), appuyez sur le bouton partager (le carre avec la fleche vers le haut).',
  },
  {
    number: '3',
    icon: 'plus-square',
    title: '"Sur l\'ecran d\'accueil"',
    description: 'Faites defiler la liste et appuyez sur "Sur l\'ecran d\'accueil". Si vous ne le voyez pas, faites defiler vers le bas.',
  },
  {
    number: '4',
    icon: 'check-circle',
    title: 'Confirmer "Ajouter"',
    description: 'Appuyez sur "Ajouter" en haut a droite. L\'icone Pepete apparait sur votre ecran d\'accueil !',
  },
];

const STEPS_ANDROID = [
  {
    number: '1',
    icon: 'chrome',
    title: 'Ouvrir Chrome',
    description: 'Ouvrez le site pepete dans Google Chrome (le navigateur par defaut sur Android).',
  },
  {
    number: '2',
    icon: 'more-vertical',
    title: 'Menu trois points',
    description: 'Appuyez sur les 3 petits points en haut a droite de Chrome pour ouvrir le menu.',
  },
  {
    number: '3',
    icon: 'smartphone',
    title: '"Ajouter a l\'ecran d\'accueil"',
    description: 'Dans le menu, cherchez et appuyez sur "Ajouter a l\'ecran d\'accueil" ou "Installer l\'application".',
  },
  {
    number: '4',
    icon: 'check-circle',
    title: 'Confirmer "Ajouter"',
    description: 'Appuyez sur "Ajouter" dans la fenetre qui s\'affiche. L\'icone Pepete apparait sur votre ecran d\'accueil !',
  },
];

const StepCard = ({ step, index, total }) => (
  <View style={[styles.stepCard, index === total - 1 && { marginBottom: 0 }]}>
    <View style={styles.stepLeft}>
      <LinearGradient
        colors={['#527A56', '#6B8F71']}
        style={styles.stepNumber}
      >
        <Text style={styles.stepNumberText}>{step.number}</Text>
      </LinearGradient>
      {index < total - 1 && <View style={styles.stepLine} />}
    </View>
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconWrap}>
          <Feather name={step.icon} size={18} color="#527A56" />
        </View>
        <Text style={styles.stepTitle}>{step.title}</Text>
      </View>
      <Text style={styles.stepDescription}>{step.description}</Text>
    </View>
  </View>
);

const InstallGuideScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('ios');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const steps = activeTab === 'ios' ? STEPS_IOS : STEPS_ANDROID;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Installer l'app</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Hero */}
          <LinearGradient
            colors={['#527A56', '#6B8F71', '#8CB092']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroIconWrap}>
              <Text style={styles.heroEmoji}>{'\uD83D\uDCF2'}</Text>
            </View>
            <Text style={styles.heroTitle}>Installez Pepete</Text>
            <Text style={styles.heroSubtitle}>
              Pepete fonctionne comme une vraie application !{'\n'}
              Ajoutez-la sur votre ecran d'accueil en quelques secondes.
            </Text>
            <View style={styles.heroBadges}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeIcon}>{'\u26A1'}</Text>
                <Text style={styles.heroBadgeText}>Rapide</Text>
              </View>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeIcon}>{'\uD83D\uDCF4'}</Text>
                <Text style={styles.heroBadgeText}>Hors-ligne</Text>
              </View>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeIcon}>{'\uD83D\uDD12'}</Text>
                <Text style={styles.heroBadgeText}>Securise</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Tab selector iOS / Android */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'ios' && styles.tabActive]}
              onPress={() => setActiveTab('ios')}
              activeOpacity={0.7}
            >
              <Feather
                name="smartphone"
                size={16}
                color={activeTab === 'ios' ? '#527A56' : colors.textTertiary}
              />
              <Text style={[styles.tabText, activeTab === 'ios' && styles.tabTextActive]}>
                iPhone / iPad
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'android' && styles.tabActive]}
              onPress={() => setActiveTab('android')}
              activeOpacity={0.7}
            >
              <Feather
                name="smartphone"
                size={16}
                color={activeTab === 'android' ? '#527A56' : colors.textTertiary}
              />
              <Text style={[styles.tabText, activeTab === 'android' && styles.tabTextActive]}>
                Android
              </Text>
            </TouchableOpacity>
          </View>

          {/* Steps */}
          <View style={styles.stepsSection}>
            <Text style={styles.sectionTitle}>
              {activeTab === 'ios' ? 'Sur iPhone / iPad (Safari)' : 'Sur Android (Chrome)'}
            </Text>
            <View style={styles.stepsCard}>
              {steps.map((step, index) => (
                <StepCard key={step.number} step={step} index={index} total={steps.length} />
              ))}
            </View>
          </View>

          {/* Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>Bon a savoir</Text>
            <View style={styles.tipCard}>
              <View style={styles.tipIconWrap}>
                <Feather name="info" size={18} color="#C4956A" />
              </View>
              <Text style={styles.tipText}>
                Pas besoin de telecharger depuis l'App Store ou le Play Store. Pepete est une application web progressive (PWA) qui s'installe directement depuis votre navigateur.
              </Text>
            </View>
            <View style={styles.tipCard}>
              <View style={styles.tipIconWrap}>
                <Feather name="refresh-cw" size={18} color="#6B8F71" />
              </View>
              <Text style={styles.tipText}>
                L'application se met a jour automatiquement. Vous aurez toujours la derniere version sans rien faire.
              </Text>
            </View>
            <View style={styles.tipCard}>
              <View style={styles.tipIconWrap}>
                <Feather name="wifi-off" size={18} color="#527A56" />
              </View>
              <Text style={styles.tipText}>
                Certaines fonctionnalites sont disponibles meme sans connexion internet.
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING['3xl'],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: HEADER_PADDING_TOP,
    paddingBottom: SPACING.base,
    paddingHorizontal: SPACING.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  headerSpacer: {
    width: 36,
  },

  // Hero
  hero: {
    margin: SPACING.lg,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
  },
  heroEmoji: {
    fontSize: 32,
  },
  heroTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '800',
    color: colors.white,
    marginBottom: SPACING.sm,
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.base,
  },
  heroBadges: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  heroBadgeIcon: {
    fontSize: 12,
  },
  heroBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: colors.white,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    backgroundColor: colors.white,
    borderRadius: RADIUS.xl,
    padding: 4,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#527A5612',
  },
  tabText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: '#527A56',
    fontWeight: '700',
  },

  // Steps
  stepsSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
  },
  stepsCard: {
    backgroundColor: colors.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    ...SHADOWS.md,
  },

  // Step
  stepCard: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  stepLeft: {
    alignItems: 'center',
    width: 36,
    marginRight: SPACING.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: colors.white,
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#6B8F7130',
    marginTop: SPACING.xs,
    borderRadius: 1,
  },
  stepContent: {
    flex: 1,
    paddingTop: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  stepIconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: '#527A5610',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  stepDescription: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Tips
  tipsSection: {
    paddingHorizontal: SPACING.lg,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  tipIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  tipText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  bottomSpacer: {
    height: SPACING['2xl'],
  },
});

export default InstallGuideScreen;
