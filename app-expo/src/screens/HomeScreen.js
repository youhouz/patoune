import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, StatusBar, Dimensions, RefreshControl, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getMyPetsAPI } from '../api/pets';
import { getScanHistoryAPI } from '../api/products';
import { getMyBookingsAPI } from '../api/petsitters';
import { FONTS, TEXT_STYLES } from '../utils/typography';
const { COLORS, SPACING, RADIUS, SHADOWS, FONT_SIZE, getScoreColor, getScoreLabel } = require('../utils/colors');

const { width } = Dimensions.get('window');

// ─── Animated wrapper with staggered fade-in + slide-up ──────
const AnimatedSection = ({ delay = 0, children, style }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 550,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {children}
    </Animated.View>
  );
};

// ─── Pressable card with scale micro-interaction ─────────────
const PressableCard = ({ onPress, style, children, activeOpacity = 0.92 }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.965,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={activeOpacity}
      style={{ flex: style?.flex }}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Glass Card wrapper ──────────────────────────────────────
const GlassCard = ({ children, style }) => (
  <View style={[s.glassCard, style]}>
    {children}
  </View>
);

// ─── Recent Scan Card ──────────────────────────────────────
const RecentScanCard = ({ scan, onPress }) => {
  const score = scan.product?.nutritionScore || 0;
  const color = getScoreColor(score);
  return (
    <PressableCard style={s.scanCard} onPress={onPress}>
      <View style={[s.scanScoreBadge, { backgroundColor: color + '15' }]}>
        <Text style={[s.scanScoreText, { color }]}>{score}</Text>
      </View>
      <View style={s.scanInfo}>
        <Text style={s.scanName} numberOfLines={1}>{scan.product?.name || 'Produit'}</Text>
        <Text style={s.scanBrand} numberOfLines={1}>{scan.product?.brand || ''}</Text>
      </View>
      <View style={[s.scanLabel, { backgroundColor: color + '12' }]}>
        <Text style={[s.scanLabelText, { color }]}>{getScoreLabel(score)}</Text>
      </View>
    </PressableCard>
  );
};

// ─── Next Booking Card ─────────────────────────────────────
const NextBookingCard = ({ booking }) => {
  if (!booking) return null;
  const start = new Date(booking.startDate);
  const daysUntil = Math.ceil((start - new Date()) / (1000 * 60 * 60 * 24));
  const dayLabel = daysUntil <= 0 ? "Aujourd'hui" : daysUntil === 1 ? 'Demain' : `Dans ${daysUntil}j`;
  const serviceLabels = {
    garde_domicile: 'Garde a domicile',
    garde_chez_sitter: 'Chez le gardien',
    promenade: 'Promenade',
    visite: 'Visite a domicile',
    toilettage: 'Toilettage',
  };
  return (
    <PressableCard style={s.bookingCard}>
      <LinearGradient
        colors={['#059669', '#10B981']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.bookingGradient}
      >
        <View style={s.bookingDecoCircle} />
        <View style={s.bookingTop}>
          <View style={s.bookingBadge}>
            <Text style={s.bookingBadgeText}>{dayLabel}</Text>
          </View>
          <Text style={s.bookingPrice}>{booking.totalPrice} EUR</Text>
        </View>
        <Text style={s.bookingService}>{serviceLabels[booking.service] || booking.service}</Text>
        <View style={s.bookingMeta}>
          <Text style={s.bookingMetaText}>
            {start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </Text>
          <View style={s.bookingStatusBadge}>
            <Text style={s.bookingStatusText}>
              {booking.status === 'confirmed' ? 'Confirme' : 'En attente'}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </PressableCard>
  );
};

// ─── Pet Mini Card ─────────────────────────────────────────
const PetMiniCard = ({ pet }) => {
  const speciesEmojis = { chien: '🐕', chat: '🐈', oiseau: '🦜', rongeur: '🐹', reptile: '🦎', poisson: '🐟' };
  return (
    <View style={s.petMini}>
      <View style={s.petMiniAvatar}>
        <LinearGradient
          colors={[COLORS.primarySoft, '#FFF3EE']}
          style={s.petMiniAvatarGradient}
        >
          <Text style={s.petMiniEmoji}>{speciesEmojis[pet.species] || '🐾'}</Text>
        </LinearGradient>
      </View>
      <Text style={s.petMiniName} numberOfLines={1}>{pet.name}</Text>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════
const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Hero entry animation
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(heroSlide, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  const fetchData = async () => {
    try {
      const [petsRes, scansRes, bookingsRes] = await Promise.allSettled([
        getMyPetsAPI(),
        getScanHistoryAPI(),
        getMyBookingsAPI(),
      ]);
      if (petsRes.status === 'fulfilled') setPets(petsRes.value.data?.pets || petsRes.value.data || []);
      if (scansRes.status === 'fulfilled') setRecentScans((scansRes.value.data?.history || scansRes.value.data || []).slice(0, 5));
      if (bookingsRes.status === 'fulfilled') {
        const all = bookingsRes.value.data?.bookings || bookingsRes.value.data || [];
        const upcoming = all
          .filter(b => b.status === 'confirmed' || b.status === 'pending')
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        setBookings(upcoming);
      }
    } catch (err) {
      console.log('Home fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const firstName = user?.name?.split(' ')[0] || 'ami';
  const hour = new Date().getHours();
  const greetText = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bonne journee' : 'Bonsoir';

  const features = [
    {
      icon: '📷',
      title: 'Scanner',
      subtitle: 'Analyser un aliment',
      gradient: ['#FF6B35', '#FF8F65'],
      onPress: () => navigation.navigate('Scanner'),
    },
    {
      icon: '🏠',
      title: 'Gardiens',
      subtitle: 'Trouver un gardien',
      gradient: ['#059669', '#10B981'],
      onPress: () => navigation.navigate('Garde'),
    },
    {
      icon: '🐾',
      title: 'Animaux',
      subtitle: 'Mes compagnons',
      gradient: ['#2563EB', '#60A5FA'],
      onPress: () => navigation.navigate('Profil', { screen: 'MyPets' }),
    },
  ];

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ── Hero Header ── */}
        <Animated.View style={{ opacity: heroFade, transform: [{ translateY: heroSlide }] }}>
          <LinearGradient
            colors={COLORS.gradientHero}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.hero}
          >
            {/* Decorative circles */}
            <View style={s.heroCircle1} />
            <View style={s.heroCircle2} />
            <View style={s.heroCircle3} />

            <View style={s.heroTop}>
              <View style={s.heroGreetBox}>
                <Text style={s.greetingOverline}>{greetText}</Text>
                <Text style={s.userName}>{firstName}</Text>
              </View>
              <TouchableOpacity
                style={s.avatarBtn}
                onPress={() => navigation.navigate('Profil')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.32)', 'rgba(255,255,255,0.12)']}
                  style={s.avatarGradient}
                >
                  <Text style={s.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Search bar — glass style */}
            <TouchableOpacity style={s.searchBar} onPress={() => navigation.navigate('Scanner')} activeOpacity={0.8}>
              <Text style={s.searchIcon}>🔍</Text>
              <Text style={s.searchPlaceholder}>Rechercher un produit, un gardien...</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* ── Mes animaux ── */}
        {pets.length > 0 && (
          <AnimatedSection delay={100} style={s.petsSection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Mes compagnons</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Profil', { screen: 'MyPets' })}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={s.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.petsScroll}>
              {pets.map((pet, idx) => <PetMiniCard key={pet._id || idx} pet={pet} />)}
              <TouchableOpacity style={s.petMiniAdd} onPress={() => navigation.navigate('Profil', { screen: 'AddPet' })}>
                <View style={s.petMiniAddCircle}><Text style={s.petMiniAddIcon}>+</Text></View>
                <Text style={s.petMiniAddLabel}>Ajouter</Text>
              </TouchableOpacity>
            </ScrollView>
          </AnimatedSection>
        )}

        {/* ── Que faire ? ── */}
        <AnimatedSection delay={200} style={s.featuresSection}>
          <Text style={s.sectionTitle}>Que voulez-vous faire ?</Text>
          <View style={s.featuresGrid}>
            {features.map((f, idx) => (
              <PressableCard key={idx} onPress={f.onPress} style={s.featureCardWrapper}>
                <LinearGradient colors={f.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.featureCard}>
                  <View style={s.featureDecoCircle} />
                  <Text style={s.featureIcon}>{f.icon}</Text>
                  <View>
                    <Text style={s.featureTitle}>{f.title}</Text>
                    <Text style={s.featureSubtitle}>{f.subtitle}</Text>
                  </View>
                  <View style={s.featureArrow}><Text style={s.featureArrowText}>→</Text></View>
                </LinearGradient>
              </PressableCard>
            ))}
          </View>
        </AnimatedSection>

        {/* ── Tableau de bord ── */}
        <AnimatedSection delay={300} style={s.statsSection}>
          <Text style={s.sectionTitle}>Mon tableau de bord</Text>
          <GlassCard style={s.statsCard}>
            {[
              { value: recentScans.length, label: 'Produits\nscannes', icon: '📷', color: '#FF6B35' },
              { value: pets.length, label: 'Animaux\nenregistres', icon: '🐾', color: '#059669' },
              { value: bookings.length, label: 'Gardes\na venir', icon: '📅', color: '#2563EB' },
            ].map((stat, idx) => (
              <React.Fragment key={idx}>
                <View style={s.stat}>
                  <View style={[s.statIconWrap, { backgroundColor: stat.color + '10' }]}>
                    <Text style={s.statIcon}>{stat.icon}</Text>
                  </View>
                  <Text style={[s.statValue, { color: stat.color }]}>{loading ? '-' : stat.value}</Text>
                  <Text style={s.statLabel}>{stat.label}</Text>
                </View>
                {idx < 2 && <View style={s.statDivider} />}
              </React.Fragment>
            ))}
          </GlassCard>
        </AnimatedSection>

        {/* ── Prochaine garde ── */}
        {bookings.length > 0 && (
          <AnimatedSection delay={400} style={s.bookingSection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Prochaine garde</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Garde')}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={s.seeAll}>Historique</Text>
              </TouchableOpacity>
            </View>
            <NextBookingCard booking={bookings[0]} />
          </AnimatedSection>
        )}

        {/* ── Derniers scans ── */}
        {recentScans.length > 0 && (
          <AnimatedSection delay={500} style={s.scansSection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Derniers scans</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Scanner', { screen: 'ScanHistory' })}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={s.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            {recentScans.slice(0, 3).map((scan, idx) => (
              <RecentScanCard
                key={scan._id || idx}
                scan={scan}
                onPress={() => navigation.navigate('Scanner', { screen: 'ProductResult', params: { product: scan.product } })}
              />
            ))}
          </AnimatedSection>
        )}

        {/* ── Acces rapide ── */}
        <AnimatedSection delay={550} style={s.quickSection}>
          <Text style={s.sectionTitle}>Acces rapide</Text>
          <View style={s.quickGrid}>
            {[
              { icon: '📋', label: 'Historique\nscans', onPress: () => navigation.navigate('Scanner', { screen: 'ScanHistory' }) },
              { icon: '📅', label: 'Reservations', onPress: () => navigation.navigate('Garde') },
              { icon: '💬', label: 'Messages', onPress: () => navigation.navigate('Garde', { screen: 'Messages' }) },
              { icon: '⚙️', label: 'Reglages', onPress: () => navigation.navigate('Profil', { screen: 'Settings' }) },
            ].map((qa, idx) => (
              <PressableCard key={idx} style={s.quickAction} onPress={qa.onPress}>
                <GlassCard style={s.quickIconWrap}>
                  <Text style={s.quickIcon}>{qa.icon}</Text>
                </GlassCard>
                <Text style={s.quickLabel}>{qa.label}</Text>
              </PressableCard>
            ))}
          </View>
        </AnimatedSection>

        {/* ── Banniere Patoune ── */}
        <AnimatedSection delay={600} style={s.bannerSection}>
          <PressableCard onPress={() => navigation.navigate('Scanner')} style={s.bannerPressable}>
            <LinearGradient
              colors={COLORS.gradientAccent}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.bannerGradient}
            >
              <View style={s.bannerDecoCircle1} />
              <View style={s.bannerDecoCircle2} />
              <View style={s.bannerIconCircle}>
                <Text style={s.bannerEmoji}>🔬</Text>
              </View>
              <View style={s.bannerContent}>
                <Text style={s.bannerTitle}>Controlez ce que mange votre animal</Text>
                <Text style={s.bannerText}>Scannez les emballages pour connaitre la qualite de chaque produit.</Text>
                <View style={s.bannerBtn}>
                  <Text style={s.bannerBtnText}>Scanner maintenant  →</Text>
                </View>
              </View>
            </LinearGradient>
          </PressableCard>
        </AnimatedSection>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 24 },

  // ── Glass Card (shared) ──
  glassCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    ...SHADOWS.md,
  },

  // ── Hero ──
  hero: {
    paddingTop: Platform.OS === 'ios' ? 64 : 54,
    paddingHorizontal: SPACING.xl,
    paddingBottom: 36,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },
  heroCircle1: {
    position: 'absolute', top: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroCircle2: {
    position: 'absolute', bottom: -70, left: -50,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroCircle3: {
    position: 'absolute', top: 60, left: width * 0.4,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 26,
  },
  heroGreetBox: {},
  greetingOverline: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.82)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  userName: {
    fontFamily: FONTS.brand,
    fontSize: 34,
    color: '#FFF',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  avatarBtn: {
    width: 56, height: 56, borderRadius: 28,
    overflow: 'hidden',
    ...SHADOWS.glow('rgba(255,255,255,0.3)'),
  },
  avatarGradient: {
    flex: 1,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 28,
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarText: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    color: '#FFF',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: RADIUS.xl, paddingHorizontal: 18, height: 54,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    // Glass-morphism effect approximation
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  searchIcon: { fontSize: 17, marginRight: 12 },
  searchPlaceholder: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.72)',
  },

  // ── Section header ──
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  seeAll: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
  },

  // ── Pets ──
  petsSection: { paddingLeft: SPACING.xl, marginTop: 28 },
  petsScroll: { gap: 16, paddingRight: SPACING.xl },
  petMini: { alignItems: 'center', width: 76 },
  petMiniAvatar: {
    width: 66, height: 66, borderRadius: 33,
    marginBottom: 8,
    ...SHADOWS.sm,
  },
  petMiniAvatarGradient: {
    width: 66, height: 66, borderRadius: 33,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: COLORS.primary + '20',
  },
  petMiniEmoji: { fontSize: 30 },
  petMiniName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.xs,
    color: COLORS.text,
    textAlign: 'center',
  },
  petMiniAdd: { alignItems: 'center', width: 76, justifyContent: 'center' },
  petMiniAddCircle: {
    width: 66, height: 66, borderRadius: 33,
    borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  petMiniAddIcon: { fontSize: 28, color: COLORS.textTertiary },
  petMiniAddLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
  },

  // ── Features ──
  featuresSection: { paddingHorizontal: SPACING.xl, marginTop: 30 },
  featuresGrid: { flexDirection: 'row', gap: 12, marginTop: 16 },
  featureCardWrapper: { flex: 1 },
  featureCard: {
    borderRadius: RADIUS['2xl'], padding: 18,
    height: 162, justifyContent: 'space-between',
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  featureDecoCircle: {
    position: 'absolute', top: -20, right: -20,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  featureIcon: { fontSize: 34 },
  featureTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.md,
    color: '#FFF',
  },
  featureSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 3,
  },
  featureArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end',
  },
  featureArrowText: {
    color: '#FFF', fontSize: 16,
    fontFamily: FONTS.heading,
  },

  // ── Stats ──
  statsSection: { paddingHorizontal: SPACING.xl, marginTop: 32 },
  statsCard: {
    paddingVertical: 24, paddingHorizontal: 10,
    flexDirection: 'row', justifyContent: 'space-around',
    marginTop: 16,
  },
  stat: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, backgroundColor: COLORS.borderLight, marginVertical: 10 },
  statIconWrap: {
    width: 54, height: 54, borderRadius: RADIUS.lg,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  statIcon: { fontSize: 26 },
  statValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE['2xl'],
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 4, textAlign: 'center', lineHeight: 16,
  },

  // ── Booking ──
  bookingSection: { paddingHorizontal: SPACING.xl, marginTop: 32 },
  bookingCard: {
    borderRadius: RADIUS['2xl'], overflow: 'hidden',
    ...SHADOWS.lg, marginTop: 16,
  },
  bookingGradient: { padding: 22, borderRadius: RADIUS['2xl'], overflow: 'hidden' },
  bookingDecoCircle: {
    position: 'absolute', top: -30, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bookingTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  bookingBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 6,
  },
  bookingBadgeText: {
    fontFamily: FONTS.bodySemiBold,
    color: '#FFF', fontSize: FONT_SIZE.sm,
  },
  bookingPrice: {
    fontFamily: FONTS.heading,
    color: '#FFF', fontSize: FONT_SIZE['2xl'],
    letterSpacing: -0.5,
  },
  bookingService: {
    fontFamily: FONTS.heading,
    color: '#FFF', fontSize: FONT_SIZE.lg,
    marginBottom: 12,
  },
  bookingMeta: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  bookingMetaText: {
    fontFamily: FONTS.bodyMedium,
    color: 'rgba(255,255,255,0.88)', fontSize: FONT_SIZE.sm,
  },
  bookingStatusBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 4,
  },
  bookingStatusText: {
    fontFamily: FONTS.bodySemiBold,
    color: '#FFF', fontSize: FONT_SIZE.xs,
  },

  // ── Scans ──
  scansSection: { paddingHorizontal: SPACING.xl, marginTop: 32 },
  scanCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16, marginTop: 10,
    borderWidth: 1, borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  scanScoreBadge: {
    width: 50, height: 50, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  scanScoreText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.md,
  },
  scanInfo: { flex: 1, marginRight: 10 },
  scanName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  scanBrand: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  scanLabel: {
    borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 6,
  },
  scanLabelText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.xs,
  },

  // ── Quick actions ──
  quickSection: { paddingHorizontal: SPACING.xl, marginTop: 32 },
  quickGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  quickAction: { alignItems: 'center', flex: 1 },
  quickIconWrap: {
    width: 64, height: 64, borderRadius: RADIUS.xl,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  quickIcon: { fontSize: 28 },
  quickLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.xs - 1,
    color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 16,
  },

  // ── Banner ──
  bannerSection: { paddingHorizontal: SPACING.xl, marginTop: 32 },
  bannerPressable: {},
  bannerGradient: {
    borderRadius: RADIUS['2xl'], padding: 24,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  bannerDecoCircle1: {
    position: 'absolute', top: -40, right: -40,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bannerDecoCircle2: {
    position: 'absolute', bottom: -50, left: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  bannerIconCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  bannerEmoji: { fontSize: 30 },
  bannerContent: {},
  bannerTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.lg,
    color: '#FFF', marginBottom: 8, lineHeight: 26,
  },
  bannerText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.82)', lineHeight: 22, marginBottom: 18,
  },
  bannerBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.full, paddingHorizontal: 22, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  bannerBtnText: {
    fontFamily: FONTS.bodySemiBold,
    color: '#FFF', fontSize: FONT_SIZE.sm,
  },
});

export default HomeScreen;
