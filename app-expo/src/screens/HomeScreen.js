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

// ─── Recent Scan Card ────────────────────────────────
const RecentScanCard = ({ scan, onPress }) => {
  const score = scan.product?.nutritionScore || 0;
  const color = getScoreColor(score);
  return (
    <TouchableOpacity style={s.scanCard} onPress={onPress} activeOpacity={0.8}>
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

// ─── Next Booking Card ───────────────────────────────
const NextBookingCard = ({ booking }) => {
  if (!booking) return null;
  const start = new Date(booking.startDate);
  const daysUntil = Math.ceil((start - new Date()) / (1000 * 60 * 60 * 24));
  const dayLabel = daysUntil <= 0 ? "Aujourd'hui" : daysUntil === 1 ? 'Demain' : `Dans ${daysUntil}j`;
  const serviceLabels = {
    garde_domicile: 'Garde a domicile',
    garde_chez_sitter: 'Garde chez le gardien',
    promenade: 'Promenade',
    visite: 'Visite',
    toilettage: 'Toilettage',
  };
  return (
    <View style={s.bookingCard}>
      <LinearGradient
        colors={['#10B981', '#34D399']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.bookingGradient}
      >
        <View style={s.bookingTop}>
          <View style={s.bookingBadge}>
            <Text style={s.bookingBadgeText}>{dayLabel}</Text>
          </View>
          <Text style={s.bookingPrice}>{booking.totalPrice}E</Text>
        </View>
        <Text style={s.bookingService}>{serviceLabels[booking.service] || booking.service}</Text>
        <View style={s.bookingMeta}>
          <Text style={s.bookingMetaText}>
            {start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </Text>
          <Text style={s.bookingMetaText}>
            {booking.status === 'confirmed' ? 'Confirmee' : 'En attente'}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

// ─── Pet Mini Card ───────────────────────────────────
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

// ═══════════════════════════════════════════════════════
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
  const greetText = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon apres-midi' : 'Bonsoir';

  const features = [
    { icon: '📷', title: 'Scanner', subtitle: 'Analyser un produit', gradient: ['#FF6B35', '#FF8F65'], onPress: () => navigation.navigate('Scanner') },
    { icon: '🏠', title: 'Garde', subtitle: 'Trouver un gardien', gradient: ['#10B981', '#34D399'], onPress: () => navigation.navigate('Garde') },
    { icon: '🐾', title: 'Animaux', subtitle: 'Mes compagnons', gradient: ['#3B82F6', '#60A5FA'], onPress: () => navigation.navigate('Profil', { screen: 'MyPets' }) },
  ];

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Hero */}
        <LinearGradient colors={['#FF6B35', '#FF8F65', '#FFB088']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <View style={s.heroTop}>
            <View>
              <Text style={s.greeting}>{greetText}</Text>
              <Text style={s.userName}>{firstName} 👋</Text>
            </View>
            <TouchableOpacity style={s.avatarBtn} onPress={() => navigation.navigate('Profil')} activeOpacity={0.8}>
              <Text style={s.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={s.searchBar} onPress={() => navigation.navigate('Scanner')} activeOpacity={0.8}>
            <Text style={s.searchIcon}>🔍</Text>
            <Text style={s.searchPlaceholder}>Rechercher un produit, un gardien...</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Pets */}
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

        {/* Features */}
        <View style={s.featuresSection}>
          <Text style={s.sectionTitle}>Que veux-tu faire ?</Text>
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

        {/* Stats */}
        <View style={s.statsSection}>
          <Text style={s.sectionTitle}>Mon tableau de bord</Text>
          <View style={s.statsCard}>
            <View style={s.statsRow}>
              {[
                { value: recentScans.length, label: 'Scans', icon: '📷', color: '#FF6B35' },
                { value: pets.length, label: 'Animaux', icon: '🐾', color: '#10B981' },
                { value: bookings.length, label: 'Gardes', icon: '📅', color: '#3B82F6' },
              ].map((stat, idx) => (
                <View key={idx} style={s.stat}>
                  <View style={[s.statIconWrap, { backgroundColor: stat.color + '12' }]}>
                    <Text style={s.statIcon}>{stat.icon}</Text>
                  </View>
                  <Text style={[s.statValue, { color: stat.color }]}>{loading ? '-' : stat.value}</Text>
                  <Text style={s.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Next Booking */}
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

        {/* Recent Scans */}
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

        {/* Quick Actions */}
        <View style={s.quickSection}>
          <Text style={s.sectionTitle}>Acces rapide</Text>
          <View style={s.quickGrid}>
            {[
              { icon: '🔍', label: 'Historique', onPress: () => navigation.navigate('Scanner', { screen: 'ScanHistory' }) },
              { icon: '📋', label: 'Reservations', onPress: () => navigation.navigate('Garde') },
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

        {/* Tip */}
        <View style={s.tipSection}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Scanner')}>
            <LinearGradient colors={['#6C5CE7', '#A29BFE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.tipGradient}>
              <Text style={s.tipEmoji}>💡</Text>
              <View style={s.tipContent}>
                <Text style={s.tipTitle}>Le saviez-vous ?</Text>
                <Text style={s.tipText}>Scannez les produits de vos animaux pour verifier leur qualite et decouvrir des alternatives plus saines.</Text>
              </View>
              <Text style={s.tipArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 20 },
  hero: { paddingTop: Platform.OS === 'ios' ? 58 : 48, paddingHorizontal: 20, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500', letterSpacing: 0.3 },
  userName: { fontSize: 26, fontWeight: '800', color: '#FFF', marginTop: 2, letterSpacing: -0.5 },
  avatarBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.45)' },
  avatarText: { fontSize: 21, fontWeight: '700', color: '#FFF' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.lg, paddingHorizontal: 16, height: 48, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchPlaceholder: { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  seeAll: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  petsSection: { paddingLeft: 20, marginTop: 22 },
  petsScroll: { gap: 12, paddingRight: 20 },
  petMini: { alignItems: 'center', width: 68 },
  petMiniAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: COLORS.primary + '30', marginBottom: 6 },
  petMiniEmoji: { fontSize: 26 },
  petMiniName: { fontSize: 12, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  petMiniAdd: { alignItems: 'center', width: 68, justifyContent: 'center' },
  petMiniAddCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  petMiniAddIcon: { fontSize: 24, color: COLORS.textTertiary },
  petMiniAddLabel: { fontSize: 12, fontWeight: '500', color: COLORS.textTertiary },

  featuresSection: { paddingHorizontal: 20, marginTop: 24 },
  featuresGrid: { flexDirection: 'row', gap: 10, marginTop: 12 },
  featureCardWrapper: { flex: 1 },
  featureCard: { borderRadius: RADIUS.xl, padding: 16, height: 140, justifyContent: 'space-between', ...SHADOWS.lg },
  featureIcon: { fontSize: 30 },
  featureTitle: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  featureSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginTop: 2 },
  featureArrow: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  featureArrowText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  statsSection: { paddingHorizontal: 20, marginTop: 28 },
  statsCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 20, ...SHADOWS.md, marginTop: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statIconWrap: { width: 50, height: 50, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statIcon: { fontSize: 24 },
  statValue: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500', marginTop: 2 },

  bookingSection: { paddingHorizontal: 20, marginTop: 28 },
  bookingCard: { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOWS.lg },
  bookingGradient: { padding: 18, borderRadius: RADIUS.xl },
  bookingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  bookingBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 4 },
  bookingBadgeText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  bookingPrice: { color: '#FFF', fontWeight: '800', fontSize: 22 },
  bookingService: { color: '#FFF', fontWeight: '700', fontSize: 17, marginBottom: 8 },
  bookingMeta: { flexDirection: 'row', gap: 16 },
  bookingMetaText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '500' },

  scansSection: { paddingHorizontal: 20, marginTop: 28 },
  scanCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 14, marginBottom: 10, ...SHADOWS.sm },
  scanScoreBadge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  scanScoreText: { fontSize: 16, fontWeight: '800' },
  scanInfo: { flex: 1, marginRight: 8 },
  scanName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  scanBrand: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  scanLabel: { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  scanLabelText: { fontSize: 11, fontWeight: '700' },

  quickSection: { paddingHorizontal: 20, marginTop: 28 },
  quickGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  quickAction: { alignItems: 'center', width: (width - 40 - 36) / 4 },
  quickIconWrap: { width: 56, height: 56, borderRadius: RADIUS.xl, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', ...SHADOWS.md, marginBottom: 8 },
  quickIcon: { fontSize: 24 },
  quickLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', textAlign: 'center' },

  tipSection: { paddingHorizontal: 20, marginTop: 28 },
  tipGradient: { borderRadius: RADIUS.xl, padding: 20, flexDirection: 'row', alignItems: 'center', ...SHADOWS.lg },
  tipEmoji: { fontSize: 34, marginRight: 14 },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  tipText: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 18 },
  tipArrow: { fontSize: 20, color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
});

export default HomeScreen;
