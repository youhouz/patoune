// ═══════════════════════════════════════════════════════════════════════════
// Pépète v7.0 — HomeScreen (Dark Premium 2027 — Revolut Dashboard Style)
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, StatusBar, RefreshControl, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getMyPetsAPI } from '../api/pets';
import { getScanHistoryAPI } from '../api/products';
import { getMyBookingsAPI } from '../api/petsitters';
import { PepeteIcon } from '../components/PepeteLogo';
import useResponsive from '../hooks/useResponsive';
const { COLORS, SPACING, RADIUS, SHADOWS, FONT_SIZE, getScoreColor, getScoreLabel } = require('../utils/colors');

// ─── Recent Scan Card ────────────────────────────────────────────────────
const RecentScanCard = ({ scan, onPress }) => {
  const score = scan.product?.nutritionScore || 0;
  const color = getScoreColor(score);
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 300 }).start()}
      onPressOut={() => { Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start(); onPress?.(); }}
      activeOpacity={1}
    >
      <Animated.View style={[s.scanCard, { transform: [{ scale }] }]}>
        <View style={[s.scanScore, { backgroundColor: color + '15' }]}>
          <Text style={[s.scanScoreNum, { color }]}>{score}</Text>
        </View>
        <View style={s.scanInfo}>
          <Text style={s.scanName} numberOfLines={1}>{scan.product?.name || 'Produit'}</Text>
          <Text style={s.scanBrand} numberOfLines={1}>{scan.product?.brand || '—'}</Text>
        </View>
        <View style={[s.scanBadge, { backgroundColor: color + '12' }]}>
          <Text style={[s.scanBadgeText, { color }]}>{getScoreLabel(score)}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Next Booking Card ───────────────────────────────────────────────────
const NextBookingCard = ({ booking }) => {
  if (!booking) return null;
  const start = new Date(booking.startDate);
  const daysUntil = Math.ceil((start - new Date()) / (1000 * 60 * 60 * 24));
  const dayLabel = daysUntil <= 0 ? "Aujourd'hui" : daysUntil === 1 ? 'Demain' : `Dans ${daysUntil}j`;
  const labels = { garde_domicile: 'Garde à domicile', garde_chez_sitter: 'Chez le gardien', promenade: 'Promenade', visite: 'Visite', toilettage: 'Toilettage' };
  return (
    <View style={s.bookingCard}>
      <LinearGradient colors={['#00C853', '#00E676']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.bookingGrad}>
        <View style={s.bookingTop}>
          <View style={s.bookingTimeBadge}>
            <Feather name="clock" size={11} color="#080B12" />
            <Text style={s.bookingTimeText}>{dayLabel}</Text>
          </View>
          <Text style={s.bookingPrice}>{booking.totalPrice} €</Text>
        </View>
        <Text style={s.bookingService}>{labels[booking.service] || booking.service}</Text>
        <View style={s.bookingMeta}>
          <Feather name="calendar" size={13} color="rgba(8,11,18,0.7)" />
          <Text style={s.bookingDate}>{start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</Text>
          <View style={s.bookingStatus}>
            <Text style={s.bookingStatusText}>{booking.status === 'confirmed' ? 'Confirmé' : 'En attente'}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

// ─── Pet Chip ────────────────────────────────────────────────────────────
const PetChip = ({ pet, onPress }) => {
  const colorMap = { chien: COLORS.primary, chat: COLORS.accent, oiseau: COLORS.cyan, rongeur: COLORS.amber, reptile: COLORS.secondary, poisson: COLORS.accentLight };
  const color = colorMap[pet.species] || COLORS.primary;
  const initial = pet.name?.charAt(0)?.toUpperCase() || '?';
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={s.petChip}>
      <View style={[s.petAvatar, { backgroundColor: color + '16', borderColor: color + '30' }]}>
        <Text style={[s.petInitial, { color }]}>{initial}</Text>
      </View>
      <Text style={s.petName} numberOfLines={1}>{pet.name}</Text>
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { isTablet, hPadding, contentWidth } = useResponsive();
  const [pets, setPets]             = useState([]);
  const [recentScans, setScans]     = useState([]);
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchData = async () => {
    try {
      const [pR, sR, bR] = await Promise.allSettled([
        getMyPetsAPI(), getScanHistoryAPI(), getMyBookingsAPI(),
      ]);
      if (pR.status === 'fulfilled') setPets(pR.value.data?.pets || pR.value.data || []);
      if (sR.status === 'fulfilled') setScans((sR.value.data?.history || sR.value.data || []).slice(0, 5));
      if (bR.status === 'fulfilled') {
        const all = bR.value.data?.bookings || bR.value.data || [];
        setBookings(all.filter(b => b.status === 'confirmed' || b.status === 'pending').sort((a, b) => new Date(a.startDate) - new Date(b.startDate)));
      }
    } catch (e) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchData();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []));

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const firstName = user?.name?.split(' ')[0] || 'là';
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bonne journée' : 'Bonsoir';

  const centerWrap = { maxWidth: contentWidth, alignSelf: 'center', width: '100%' };

  const quickActions = [
    { icon: 'camera',        label: 'Scanner',    color: COLORS.cyan,   onPress: () => navigation.navigate('Scanner') },
    { icon: 'shield',        label: 'Gardiens',   color: COLORS.accent, onPress: () => navigation.navigate('Garde') },
    { icon: 'message-circle',label: 'Assistant',  color: COLORS.amber,  onPress: () => navigation.navigate('Assistant') },
    { icon: 'user',          label: 'Mon profil', color: COLORS.primary,onPress: () => navigation.navigate('Profil') },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} progressBackgroundColor={COLORS.surfaceHigh} />}
      >
        {/* ── HERO SECTION ────────────────────────────────── */}
        <View style={s.hero}>
          {/* Background glow */}
          <LinearGradient
            colors={[COLORS.primaryGlow, 'transparent']}
            style={s.heroGlow}
            pointerEvents="none"
          />
          <View style={[s.heroContent, { paddingHorizontal: hPadding, paddingTop: Platform.OS === 'ios' ? 64 : 52 }]}>
            <View style={[centerWrap]}>
              {/* Top row */}
              <View style={s.heroTop}>
                <View>
                  <Text style={s.greetText}>{greet},</Text>
                  <Text style={s.heroName}>{firstName} <Text style={s.heroEmoji}>👋</Text></Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Profil')} style={s.avatarBtn}>
                  <LinearGradient colors={['#00C853', '#00E676']} style={s.avatarGrad}>
                    <Text style={s.avatarChar}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Stats row — Revolut style */}
              <View style={s.statsRow}>
                {[
                  { value: loading ? '—' : recentScans.length, label: 'Scans', icon: 'camera', color: COLORS.cyan },
                  { value: loading ? '—' : pets.length,        label: 'Animaux', icon: 'heart', color: COLORS.primary },
                  { value: loading ? '—' : bookings.length,    label: 'Gardes', icon: 'calendar', color: COLORS.accent },
                ].map((st, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <View style={s.statsDivider} />}
                    <View style={s.statItem}>
                      <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
                      <Text style={s.statLabel}>{st.label}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ── QUICK ACTIONS ───────────────────────────────── */}
        <Animated.View style={[s.section, { paddingHorizontal: hPadding }, centerWrap, { opacity: fadeAnim }]}>
          <View style={s.quickRow}>
            {quickActions.map((a, i) => (
              <TouchableOpacity key={i} onPress={a.onPress} activeOpacity={0.7} style={s.quickItem}>
                <View style={[s.quickIcon, { backgroundColor: a.color + '14', borderColor: a.color + '25' }]}>
                  <Feather name={a.icon} size={22} color={a.color} />
                </View>
                <Text style={s.quickLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ── CTA BANNER (no account) ─────────────────────── */}
        {!user && (
          <View style={[s.section, { paddingHorizontal: hPadding }, centerWrap]}>
            <LinearGradient colors={['#00C853', '#00E676']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaBanner}>
              <View style={s.ctaBannerContent}>
                <PepeteIcon size={40} color="#080B12" />
                <View style={{ flex: 1 }}>
                  <Text style={s.ctaTitle}>Crée ton compte gratuit</Text>
                  <Text style={s.ctaDesc}>Accède à toutes les fonctionnalités</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Auth')} style={s.ctaBtn}>
                <Text style={s.ctaBtnText}>S'inscrire →</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* ── MES ANIMAUX ─────────────────────────────────── */}
        {pets.length > 0 && (
          <View style={s.sectionCol}>
            <View style={[s.sectionHead, { paddingHorizontal: hPadding }, centerWrap]}>
              <Text style={s.sectionTitle}>Mes compagnons</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Profil', { screen: 'MyPets' })}>
                <Text style={s.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.hScroll, { paddingLeft: hPadding }]}>
              {pets.map((p, i) => <PetChip key={p._id || i} pet={p} onPress={() => navigation.navigate('Profil', { screen: 'MyPets' })} />)}
              <TouchableOpacity style={s.petAddChip} onPress={() => navigation.navigate('Profil', { screen: 'AddPet' })}>
                <View style={s.petAddAvatar}><Feather name="plus" size={18} color={COLORS.primary} /></View>
                <Text style={s.petAddLabel}>Ajouter</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* ── PROCHAINE GARDE ─────────────────────────────── */}
        {bookings.length > 0 && (
          <View style={[s.sectionCol, { paddingHorizontal: hPadding }]}>
            <View style={[s.sectionHead, centerWrap]}>
              <Text style={s.sectionTitle}>Prochaine garde</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Garde')}>
                <Text style={s.seeAll}>Tout voir</Text>
              </TouchableOpacity>
            </View>
            <View style={[centerWrap]}>
              <NextBookingCard booking={bookings[0]} />
            </View>
          </View>
        )}

        {/* ── DERNIERS SCANS ──────────────────────────────── */}
        {recentScans.length > 0 && (
          <View style={[s.sectionCol, { paddingHorizontal: hPadding }]}>
            <View style={[s.sectionHead, centerWrap]}>
              <Text style={s.sectionTitle}>Derniers scans</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Scanner', { screen: 'ScanHistory' })}>
                <Text style={s.seeAll}>Historique</Text>
              </TouchableOpacity>
            </View>
            <View style={centerWrap}>
              {recentScans.slice(0, 3).map((sc, i) => (
                <RecentScanCard key={sc._id || i} scan={sc}
                  onPress={() => navigation.navigate('Scanner', { screen: 'ProductResult', params: { product: sc.product } })}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── SCAN CTA BANNER ─────────────────────────────── */}
        {user && (
          <View style={[s.section, { paddingHorizontal: hPadding }, centerWrap]}>
            <TouchableOpacity onPress={() => navigation.navigate('Scanner')} activeOpacity={0.88}>
              <View style={s.scanBanner}>
                <LinearGradient colors={[COLORS.cyanGlow, COLORS.primaryGlow]} style={StyleSheet.absoluteFill} />
                <View style={s.scanBannerIcon}>
                  <Feather name="camera" size={28} color={COLORS.cyan} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.scanBannerTitle}>Analyser un produit</Text>
                  <Text style={s.scanBannerDesc}>Scanner le code-barres d'un aliment pour votre animal</Text>
                </View>
                <Feather name="chevron-right" size={20} color={COLORS.textTertiary} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── EMPTY STATE (new user) ──────────────────────── */}
        {user && pets.length === 0 && recentScans.length === 0 && (
          <View style={[s.section, { paddingHorizontal: hPadding }, centerWrap]}>
            <View style={s.emptyCard}>
              <PepeteIcon size={48} color={COLORS.primary} />
              <Text style={s.emptyTitle}>Bienvenue sur Pépète !</Text>
              <Text style={s.emptyDesc}>Commence par ajouter ton premier animal pour personnaliser ton expérience.</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Profil', { screen: 'AddPet' })}>
                <Text style={s.emptyBtnText}>Ajouter un animal →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingBottom: 32 },

  // ── Hero
  hero: { position: 'relative', paddingBottom: 28 },
  heroGlow: {
    position: 'absolute',
    top: -60, left: -80, right: -80,
    height: 360,
    opacity: 0.7,
  },
  heroContent: {},
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greetText: { fontSize: 14, color: COLORS.textTertiary, fontWeight: '500', marginBottom: 4 },
  heroName: { fontSize: 30, fontWeight: '900', color: COLORS.text, letterSpacing: -1 },
  heroEmoji: { fontSize: 26 },
  avatarBtn: {},
  avatarGrad: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarChar: { fontSize: 20, fontWeight: '800', color: '#080B12' },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
  },
  statsDivider: { width: 1, backgroundColor: COLORS.border, marginHorizontal: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  statLabel: { fontSize: 12, color: COLORS.textTertiary, fontWeight: '500', marginTop: 2 },

  // Quick actions
  section: { marginTop: 28 },
  sectionCol: { marginTop: 28 },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickItem: { flex: 1, alignItems: 'center', gap: 8 },
  quickIcon: {
    width: 58, height: 58, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  quickLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', textAlign: 'center' },

  // CTA banner
  ctaBanner: {
    borderRadius: RADIUS.xl,
    padding: 20,
    gap: 12,
  },
  ctaBannerContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ctaTitle: { fontSize: 16, fontWeight: '800', color: '#080B12' },
  ctaDesc: { fontSize: 13, color: 'rgba(8,11,18,0.65)', fontWeight: '400' },
  ctaBtn: { backgroundColor: 'rgba(8,11,18,0.12)', borderRadius: RADIUS.lg, paddingVertical: 12, paddingHorizontal: 20, alignSelf: 'flex-end' },
  ctaBtnText: { fontSize: 14, fontWeight: '700', color: '#080B12' },

  // Section headers
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  hScroll: { gap: 10, paddingRight: 24, paddingBottom: 4 },

  // Pets
  petChip: { alignItems: 'center', gap: 6, width: 70 },
  petAvatar: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  petInitial: { fontSize: 20, fontWeight: '800' },
  petName: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', textAlign: 'center' },
  petAddChip: { alignItems: 'center', gap: 6, width: 70 },
  petAddAvatar: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primarySoft, borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: 'dashed' },
  petAddLabel: { fontSize: 11, color: COLORS.primary, fontWeight: '600', textAlign: 'center' },

  // Booking card
  bookingCard: { borderRadius: RADIUS.xl, overflow: 'hidden' },
  bookingGrad: { padding: 20 },
  bookingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  bookingTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(8,11,18,0.15)', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 10 },
  bookingTimeText: { fontSize: 12, fontWeight: '700', color: '#080B12' },
  bookingPrice: { fontSize: 22, fontWeight: '900', color: '#080B12' },
  bookingService: { fontSize: 17, fontWeight: '800', color: '#080B12', marginBottom: 12 },
  bookingMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bookingDate: { fontSize: 13, color: 'rgba(8,11,18,0.7)', flex: 1, fontWeight: '500' },
  bookingStatus: { backgroundColor: 'rgba(8,11,18,0.12)', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 },
  bookingStatusText: { fontSize: 12, fontWeight: '700', color: '#080B12' },

  // Scan card
  scanCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
    gap: 14,
  },
  scanScore: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  scanScoreNum: { fontSize: 17, fontWeight: '900', letterSpacing: -0.5 },
  scanInfo: { flex: 1 },
  scanName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  scanBrand: { fontSize: 12, color: COLORS.textTertiary, fontWeight: '500' },
  scanBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  scanBadgeText: { fontSize: 12, fontWeight: '700' },

  // Scan CTA banner
  scanBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 18,
    overflow: 'hidden',
  },
  scanBannerIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: COLORS.cyanSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  scanBannerTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  scanBannerDesc: { fontSize: 13, color: COLORS.textTertiary, fontWeight: '400' },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 32,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3, textAlign: 'center' },
  emptyDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  emptyBtn: { backgroundColor: COLORS.primarySoft, borderRadius: RADIUS.lg, paddingVertical: 13, paddingHorizontal: 24, borderWidth: 1, borderColor: COLORS.primary + '40', marginTop: 8 },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
});

export default HomeScreen;
