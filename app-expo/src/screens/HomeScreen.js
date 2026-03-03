import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, StatusBar, Dimensions, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getMyPetsAPI } from '../api/pets';
import { getScanHistoryAPI } from '../api/products';
import { getMyBookingsAPI } from '../api/petsitters';
const { COLORS, SPACING, RADIUS, SHADOWS, getScoreColor, getScoreLabel } = require('../utils/colors');

const { width } = Dimensions.get('window');

// ─── Recent Scan Card ──────────────────────────────────────
const RecentScanCard = ({ scan, onPress }) => {
  const score = scan.product?.nutritionScore || 0;
  const color = getScoreColor(score);
  return (
    <TouchableOpacity style={s.scanCard} onPress={onPress} activeOpacity={0.75}>
      <View style={[s.scanScoreBadge, { backgroundColor: color + '18' }]}>
        <Text style={[s.scanScoreText, { color }]}>{score}</Text>
      </View>
      <View style={s.scanInfo}>
        <Text style={s.scanName} numberOfLines={1}>{scan.product?.name || 'Produit'}</Text>
        <Text style={s.scanBrand} numberOfLines={1}>{scan.product?.brand || ''}</Text>
      </View>
      <View style={[s.scanLabel, { backgroundColor: color + '15' }]}>
        <Text style={[s.scanLabelText, { color }]}>{getScoreLabel(score)}</Text>
      </View>
    </TouchableOpacity>
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
    <View style={s.bookingCard}>
      <LinearGradient
        colors={['#059669', '#10B981']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.bookingGradient}
      >
        <View style={s.bookingTop}>
          <View style={s.bookingBadge}>
            <Text style={s.bookingBadgeText}>{dayLabel}</Text>
          </View>
          <Text style={s.bookingPrice}>{booking.totalPrice} €</Text>
        </View>
        <Text style={s.bookingService}>{serviceLabels[booking.service] || booking.service}</Text>
        <View style={s.bookingMeta}>
          <Text style={s.bookingMetaText}>
            {start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </Text>
          <View style={s.bookingStatusBadge}>
            <Text style={s.bookingStatusText}>
              {booking.status === 'confirmed' ? '✓ Confirme' : '⏳ En attente'}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

// ─── Pet Mini Card ─────────────────────────────────────────
const PetMiniCard = ({ pet }) => {
  const speciesEmojis = { chien: '🐕', chat: '🐈', oiseau: '🦜', rongeur: '🐹', reptile: '🦎', poisson: '🐟' };
  return (
    <View style={s.petMini}>
      <View style={s.petMiniAvatar}>
        <Text style={s.petMiniEmoji}>{speciesEmojis[pet.species] || '🐾'}</Text>
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
        <LinearGradient
          colors={['#FF6B35', '#FF7848', '#FFB088']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          {/* Decorative circles */}
          <View style={s.heroCircle1} />
          <View style={s.heroCircle2} />

          <View style={s.heroTop}>
            <View style={s.heroGreetBox}>
              <Text style={s.greeting}>{greetText} 👋</Text>
              <Text style={s.userName}>{firstName}</Text>
            </View>
            <TouchableOpacity
              style={s.avatarBtn}
              onPress={() => navigation.navigate('Profil')}
              activeOpacity={0.8}
            >
              <Text style={s.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <TouchableOpacity style={s.searchBar} onPress={() => navigation.navigate('Scanner')} activeOpacity={0.8}>
            <Text style={s.searchIcon}>🔍</Text>
            <Text style={s.searchPlaceholder}>Rechercher un produit, un gardien...</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── Mes animaux ── */}
        {pets.length > 0 && (
          <View style={s.petsSection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Mes compagnons</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Profil', { screen: 'MyPets' })}>
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
          </View>
        )}

        {/* ── Que faire ? ── */}
        <View style={s.featuresSection}>
          <Text style={s.sectionTitle}>Que voulez-vous faire ?</Text>
          <View style={s.featuresGrid}>
            {features.map((f, idx) => (
              <TouchableOpacity key={idx} onPress={f.onPress} activeOpacity={0.85} style={s.featureCardWrapper}>
                <LinearGradient colors={f.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.featureCard}>
                  <Text style={s.featureIcon}>{f.icon}</Text>
                  <View>
                    <Text style={s.featureTitle}>{f.title}</Text>
                    <Text style={s.featureSubtitle}>{f.subtitle}</Text>
                  </View>
                  <View style={s.featureArrow}><Text style={s.featureArrowText}>→</Text></View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Tableau de bord ── */}
        <View style={s.statsSection}>
          <Text style={s.sectionTitle}>Mon tableau de bord</Text>
          <View style={s.statsCard}>
            {[
              { value: recentScans.length, label: 'Produits\nscannés', icon: '📷', color: '#FF6B35' },
              { value: pets.length, label: 'Animaux\nenregistrés', icon: '🐾', color: '#059669' },
              { value: bookings.length, label: 'Gardes\na venir', icon: '📅', color: '#2563EB' },
            ].map((stat, idx) => (
              <React.Fragment key={idx}>
                <View style={s.stat}>
                  <View style={[s.statIconWrap, { backgroundColor: stat.color + '12' }]}>
                    <Text style={s.statIcon}>{stat.icon}</Text>
                  </View>
                  <Text style={[s.statValue, { color: stat.color }]}>{loading ? '-' : stat.value}</Text>
                  <Text style={s.statLabel}>{stat.label}</Text>
                </View>
                {idx < 2 && <View style={s.statDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── Prochaine garde ── */}
        {bookings.length > 0 && (
          <View style={s.bookingSection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Prochaine garde</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Garde')}>
                <Text style={s.seeAll}>Historique</Text>
              </TouchableOpacity>
            </View>
            <NextBookingCard booking={bookings[0]} />
          </View>
        )}

        {/* ── Derniers scans ── */}
        {recentScans.length > 0 && (
          <View style={s.scansSection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Derniers scans</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Scanner', { screen: 'ScanHistory' })}>
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
          </View>
        )}

        {/* ── Acces rapide ── */}
        <View style={s.quickSection}>
          <Text style={s.sectionTitle}>Acces rapide</Text>
          <View style={s.quickGrid}>
            {[
              { icon: '📋', label: 'Historique scans', onPress: () => navigation.navigate('Scanner', { screen: 'ScanHistory' }) },
              { icon: '📅', label: 'Reservations', onPress: () => navigation.navigate('Garde') },
              { icon: '💬', label: 'Messages', onPress: () => navigation.navigate('Garde', { screen: 'Messages' }) },
              { icon: '⚙️', label: 'Reglages', onPress: () => navigation.navigate('Profil', { screen: 'Settings' }) },
            ].map((qa, idx) => (
              <TouchableOpacity key={idx} style={s.quickAction} onPress={qa.onPress} activeOpacity={0.7}>
                <View style={s.quickIconWrap}><Text style={s.quickIcon}>{qa.icon}</Text></View>
                <Text style={s.quickLabel}>{qa.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Banniere Patoune ── */}
        <View style={s.bannerSection}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Scanner')}>
            <LinearGradient
              colors={['#5B5BD6', '#8B8BF5']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.bannerGradient}
            >
              <View style={s.bannerIconCircle}>
                <Text style={s.bannerEmoji}>🔬</Text>
              </View>
              <View style={s.bannerContent}>
                <Text style={s.bannerTitle}>Controlez ce que mange votre animal</Text>
                <Text style={s.bannerText}>Scannez les emballages pour connaitre la qualite de chaque produit.</Text>
                <View style={s.bannerBtn}>
                  <Text style={s.bannerBtnText}>Scanner maintenant →</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 20 },

  // Hero
  hero: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroCircle1: {
    position: 'absolute', top: -50, right: -50,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroCircle2: {
    position: 'absolute', bottom: -60, left: -40,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  heroGreetBox: {},
  greeting: { fontSize: 15, color: 'rgba(255,255,255,0.88)', fontWeight: '500', marginBottom: 3 },
  userName: { fontSize: 30, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  avatarBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: RADIUS.lg, paddingHorizontal: 16, height: 52,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  searchIcon: { fontSize: 17, marginRight: 10 },
  searchPlaceholder: { fontSize: 15, color: 'rgba(255,255,255,0.78)', fontWeight: '500' },

  // Section header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: COLORS.text, letterSpacing: -0.2 },
  seeAll: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  // Pets
  petsSection: { paddingLeft: 20, marginTop: 24 },
  petsScroll: { gap: 14, paddingRight: 20 },
  petMini: { alignItems: 'center', width: 70 },
  petMiniAvatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: COLORS.primary + '25', marginBottom: 7,
  },
  petMiniEmoji: { fontSize: 28 },
  petMiniName: { fontSize: 13, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  petMiniAdd: { alignItems: 'center', width: 70, justifyContent: 'center' },
  petMiniAddCircle: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginBottom: 7,
  },
  petMiniAddIcon: { fontSize: 26, color: COLORS.textTertiary },
  petMiniAddLabel: { fontSize: 13, fontWeight: '500', color: COLORS.textTertiary },

  // Features
  featuresSection: { paddingHorizontal: 20, marginTop: 26 },
  featuresGrid: { flexDirection: 'row', gap: 10, marginTop: 14 },
  featureCardWrapper: { flex: 1 },
  featureCard: {
    borderRadius: RADIUS.xl, padding: 16,
    height: 152, justifyContent: 'space-between',
    ...SHADOWS.lg,
  },
  featureIcon: { fontSize: 32 },
  featureTitle: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  featureSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.82)', fontWeight: '500', marginTop: 3 },
  featureArrow: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end',
  },
  featureArrowText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  // Stats
  statsSection: { paddingHorizontal: 20, marginTop: 30 },
  statsCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    paddingVertical: 22, paddingHorizontal: 8,
    flexDirection: 'row', justifyContent: 'space-around',
    ...SHADOWS.md, marginTop: 14,
  },
  stat: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 8 },
  statIconWrap: {
    width: 52, height: 52, borderRadius: RADIUS.lg,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  statIcon: { fontSize: 24 },
  statValue: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500', marginTop: 4, textAlign: 'center', lineHeight: 16 },

  // Booking
  bookingSection: { paddingHorizontal: 20, marginTop: 30 },
  bookingCard: { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOWS.lg, marginTop: 14 },
  bookingGradient: { padding: 20, borderRadius: RADIUS.xl },
  bookingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  bookingBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 5,
  },
  bookingBadgeText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  bookingPrice: { color: '#FFF', fontWeight: '900', fontSize: 26, letterSpacing: -0.5 },
  bookingService: { color: '#FFF', fontWeight: '700', fontSize: 18, marginBottom: 10 },
  bookingMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookingMetaText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' },
  bookingStatusBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 3 },
  bookingStatusText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  // Scans
  scansSection: { paddingHorizontal: 20, marginTop: 30 },
  scanCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 14, marginTop: 10,
    ...SHADOWS.sm,
  },
  scanScoreBadge: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  scanScoreText: { fontSize: 17, fontWeight: '900' },
  scanInfo: { flex: 1, marginRight: 8 },
  scanName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  scanBrand: { fontSize: 13, color: COLORS.textSecondary, marginTop: 3 },
  scanLabel: { borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5 },
  scanLabelText: { fontSize: 12, fontWeight: '700' },

  // Quick actions
  quickSection: { paddingHorizontal: 20, marginTop: 30 },
  quickGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  quickAction: { alignItems: 'center', flex: 1 },
  quickIconWrap: {
    width: 60, height: 60, borderRadius: RADIUS.xl,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.md, marginBottom: 8,
  },
  quickIcon: { fontSize: 26 },
  quickLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', textAlign: 'center', lineHeight: 15 },

  // Banner
  bannerSection: { paddingHorizontal: 20, marginTop: 30 },
  bannerGradient: { borderRadius: RADIUS.xl, padding: 22, ...SHADOWS.lg },
  bannerIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  bannerEmoji: { fontSize: 28 },
  bannerContent: {},
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 8, lineHeight: 24 },
  bannerText: { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 20, marginBottom: 16 },
  bannerBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: RADIUS.full, paddingHorizontal: 18, paddingVertical: 8,
  },
  bannerBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});

export default HomeScreen;
