// ---------------------------------------------------------------------------
// Patoune v2.0 - HomeScreen
// Complete redesign with Terracotta Studio aesthetic.
// Cream background, organic warm palette, Playfair + DM Sans typography.
// ---------------------------------------------------------------------------

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Auth & API
import { useAuth } from '../context/AuthContext';
import { getMyPetsAPI } from '../api/pets';
import { getScanHistoryAPI } from '../api/products';
import { getMyBookingsAPI } from '../api/petsitters';

// Design system
import { COLORS, SPACING, RADIUS, SHADOWS, getScoreColor, getScoreLabel } from '../utils/colors';
import { FONTS, TEXT_STYLES } from '../utils/typography';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import Card from '../components/Card';
import Badge from '../components/Badge';
import SectionHeader from '../components/SectionHeader';


// =========================================================================
// Sub-components
// =========================================================================

// ---------------------------------------------------------------------------
// Pet mini card for the companions ribbon
// ---------------------------------------------------------------------------
const PetMiniCard = ({ pet, onPress }) => (
  <TouchableOpacity style={styles.petMini} onPress={onPress} activeOpacity={0.7}>
    <Avatar name={pet.name} size="md" />
    <Text style={styles.petMiniName} numberOfLines={1}>{pet.name}</Text>
  </TouchableOpacity>
);


// ---------------------------------------------------------------------------
// Add pet card (dashed border)
// ---------------------------------------------------------------------------
const AddPetCard = ({ onPress }) => (
  <TouchableOpacity style={styles.addPetCard} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.addPetCircle}>
      <Icon name="plus" size={22} color={COLORS.primary} />
    </View>
    <Text style={styles.addPetLabel}>Ajouter</Text>
  </TouchableOpacity>
);


// ---------------------------------------------------------------------------
// Feature card (Scanner, Garde, Animaux)
// ---------------------------------------------------------------------------
const FeatureCard = ({ icon, iconFamily, iconColor, title, subtitle, onPress }) => (
  <Card variant="elevated" onPress={onPress} style={styles.featureCard}>
    <View style={[styles.featureIconCircle, { backgroundColor: iconColor + '15' }]}>
      <Icon name={icon} family={iconFamily} size={22} color={iconColor} />
    </View>
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureSubtitle}>{subtitle}</Text>
  </Card>
);


// ---------------------------------------------------------------------------
// Stat column
// ---------------------------------------------------------------------------
const StatColumn = ({ icon, iconFamily, iconColor, value, label, loading }) => (
  <View style={styles.statCol}>
    <View style={[styles.statIconWrap, { backgroundColor: iconColor + '12' }]}>
      <Icon name={icon} family={iconFamily} size={20} color={iconColor} />
    </View>
    <Text style={[styles.statValue, { color: iconColor }]}>{loading ? '-' : value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);


// ---------------------------------------------------------------------------
// Recent scan item
// ---------------------------------------------------------------------------
const RecentScanItem = ({ scan, onPress }) => {
  const score = scan.product?.nutritionScore || 0;
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <Card variant="elevated" onPress={onPress} style={styles.scanCard}>
      <View style={styles.scanRow}>
        {/* Score badge */}
        <View style={[styles.scanScoreBadge, { backgroundColor: color + '18' }]}>
          <Text style={[styles.scanScoreText, { color }]}>{score}</Text>
        </View>

        {/* Product info */}
        <View style={styles.scanInfo}>
          <Text style={styles.scanName} numberOfLines={1}>
            {scan.product?.name || 'Produit'}
          </Text>
          <Text style={styles.scanBrand} numberOfLines={1}>
            {scan.product?.brand || ''}
          </Text>
        </View>

        {/* Score label badge */}
        <Badge label={label} color={{ bg: color + '15', text: color, icon: color }} size="sm" />
      </View>
    </Card>
  );
};


// ---------------------------------------------------------------------------
// Next booking card
// ---------------------------------------------------------------------------
const NextBookingCard = ({ booking }) => {
  if (!booking) return null;

  const start = new Date(booking.startDate);
  const daysUntil = Math.ceil((start - new Date()) / (1000 * 60 * 60 * 24));
  const dayLabel =
    daysUntil <= 0 ? "Aujourd'hui" : daysUntil === 1 ? 'Demain' : `Dans ${daysUntil}j`;

  const serviceLabels = {
    garde_domicile: 'Garde a domicile',
    garde_chez_sitter: 'Garde chez le gardien',
    promenade: 'Promenade',
    visite: 'Visite',
    toilettage: 'Toilettage',
  };

  const statusConfig =
    booking.status === 'confirmed'
      ? { label: 'Confirmee', color: 'success' }
      : { label: 'En attente', color: 'warning' };

  return (
    <Card variant="elevated" style={styles.bookingCard}>
      <View style={styles.bookingRow}>
        <View style={styles.bookingIconWrap}>
          <Icon name="calendar" size={20} color={COLORS.secondary} />
        </View>
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingService}>
            {serviceLabels[booking.service] || booking.service}
          </Text>
          <Text style={styles.bookingDate}>
            {dayLabel} - {start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </Text>
          {booking.petSitter?.name ? (
            <Text style={styles.bookingSitter}>
              Avec {booking.petSitter.name}
            </Text>
          ) : null}
        </View>
        <Badge label={statusConfig.label} color={statusConfig.color} size="sm" />
      </View>
    </Card>
  );
};


// =========================================================================
// Main HomeScreen
// =========================================================================
const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Data state
  const [pets, setPets] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data
  const fetchData = async () => {
    try {
      const [petsRes, scansRes, bookingsRes] = await Promise.allSettled([
        getMyPetsAPI(),
        getScanHistoryAPI(),
        getMyBookingsAPI(),
      ]);

      if (petsRes.status === 'fulfilled') {
        setPets(petsRes.value.data?.pets || petsRes.value.data || []);
      }
      if (scansRes.status === 'fulfilled') {
        setRecentScans(
          (scansRes.value.data?.history || scansRes.value.data || []).slice(0, 5)
        );
      }
      if (bookingsRes.status === 'fulfilled') {
        const all = bookingsRes.value.data?.bookings || bookingsRes.value.data || [];
        const upcoming = all
          .filter((b) => b.status === 'confirmed' || b.status === 'pending')
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

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // User name
  const firstName = user?.name?.split(' ')[0] || 'ami';

  // Format today's date in French
  const today = new Date();
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const monthNames = [
    'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
  ];
  const dateString = `${dayNames[today.getDay()]} ${today.getDate()} ${monthNames[today.getMonth()]}`;

  // Top safe area padding
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPadding + 16 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* ============================================================= */}
        {/* 1. HEADER AREA                                                */}
        {/* ============================================================= */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.userName}>{firstName}</Text>
            <Text style={styles.dateText}>{dateString}</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profil')}
            activeOpacity={0.8}
          >
            <Avatar name={user?.name || '?'} size="lg" />
          </TouchableOpacity>
        </View>


        {/* ============================================================= */}
        {/* 2. PET COMPANIONS RIBBON                                      */}
        {/* ============================================================= */}
        <View style={styles.section}>
          <SectionHeader
            title="Mes compagnons"
            count={pets.length}
            onSeeAll={
              pets.length > 0
                ? () => navigation.navigate('Profil', { screen: 'MyPets' })
                : undefined
            }
          />

          {pets.length > 0 ? (
            <FlatList
              horizontal
              data={pets}
              keyExtractor={(item) => item._id || item.name}
              renderItem={({ item }) => (
                <PetMiniCard
                  pet={item}
                  onPress={() =>
                    navigation.navigate('Profil', {
                      screen: 'MyPets',
                    })
                  }
                />
              )}
              ListFooterComponent={
                <AddPetCard
                  onPress={() =>
                    navigation.navigate('Profil', { screen: 'AddPet' })
                  }
                />
              }
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.petsScroll}
            />
          ) : (
            <Card
              variant="outlined"
              onPress={() => navigation.navigate('Profil', { screen: 'AddPet' })}
              style={styles.emptyPetsCard}
            >
              <View style={styles.emptyPetsRow}>
                <View style={styles.emptyPetsIconWrap}>
                  <Icon name="plus" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyPetsText}>Ajoutez votre premier compagnon</Text>
                <Icon name="chevron-right" size={18} color={COLORS.pebble} />
              </View>
            </Card>
          )}
        </View>


        {/* ============================================================= */}
        {/* 3. AI ASSISTANT PROMPT CARD                                   */}
        {/* ============================================================= */}
        <View style={styles.section}>
          <Card
            variant="elevated"
            onPress={() => navigation.navigate('Assistant')}
            style={styles.aiCard}
          >
            <View style={styles.aiRow}>
              <View style={styles.aiIconWrap}>
                <Icon name="message-circle" size={22} color={COLORS.accent} />
              </View>
              <View style={styles.aiTextBlock}>
                <Text style={styles.aiTitle}>Posez une question a Patoune Assistant</Text>
                <Text style={styles.aiSubtitle}>Alimentation, sante, comportement...</Text>
              </View>
              <Icon name="chevron-right" size={20} color={COLORS.pebble} />
            </View>
          </Card>
        </View>


        {/* ============================================================= */}
        {/* 4. FEATURE CARDS                                              */}
        {/* ============================================================= */}
        <View style={styles.section}>
          <SectionHeader title="Que souhaitez-vous faire ?" />
          <View style={styles.featuresRow}>
            <FeatureCard
              icon="camera"
              iconColor={COLORS.primary}
              title="Scanner"
              subtitle="Analyser un produit"
              onPress={() => navigation.navigate('Scanner')}
            />
            <FeatureCard
              icon="heart"
              iconColor={COLORS.secondary}
              title="Garde"
              subtitle="Trouver un gardien"
              onPress={() => navigation.navigate('Garde')}
            />
            <FeatureCard
              icon="paw"
              iconFamily="ionicons"
              iconColor={COLORS.accent}
              title="Animaux"
              subtitle="Gerer mes compagnons"
              onPress={() => navigation.navigate('Profil', { screen: 'MyPets' })}
            />
          </View>
        </View>


        {/* ============================================================= */}
        {/* 5. STATS DASHBOARD                                            */}
        {/* ============================================================= */}
        <View style={styles.section}>
          <Card variant="elevated" style={styles.statsCard}>
            <View style={styles.statsRow}>
              <StatColumn
                icon="camera"
                iconColor={COLORS.primary}
                value={recentScans.length}
                label="Scans"
                loading={loading}
              />
              <View style={styles.statsDivider} />
              <StatColumn
                icon="paw"
                iconFamily="ionicons"
                iconColor={COLORS.secondary}
                value={pets.length}
                label="Animaux"
                loading={loading}
              />
              <View style={styles.statsDivider} />
              <StatColumn
                icon="calendar"
                iconColor={COLORS.accent}
                value={bookings.length}
                label="Gardes"
                loading={loading}
              />
            </View>
          </Card>
        </View>


        {/* ============================================================= */}
        {/* 6. NEXT BOOKING                                               */}
        {/* ============================================================= */}
        {bookings.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title="Prochaine garde"
              onSeeAll={() => navigation.navigate('Garde')}
            />
            <NextBookingCard booking={bookings[0]} />
          </View>
        ) : null}


        {/* ============================================================= */}
        {/* 7. RECENT SCANS                                               */}
        {/* ============================================================= */}
        {recentScans.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title="Derniers scans"
              count={recentScans.length}
              onSeeAll={() =>
                navigation.navigate('Scanner', { screen: 'ScanHistory' })
              }
            />
            {recentScans.slice(0, 3).map((scan, idx) => (
              <RecentScanItem
                key={scan._id || idx}
                scan={scan}
                onPress={() =>
                  navigation.navigate('Scanner', {
                    screen: 'ProductResult',
                    params: { product: scan.product },
                  })
                }
              />
            ))}
          </View>
        ) : null}

        {/* Bottom spacing */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};


// =========================================================================
// Styles
// =========================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // ---- Header ----
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  headerLeft: {
    flex: 1,
    marginRight: SPACING.base,
  },
  greeting: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  userName: {
    fontFamily: FONTS.brand,
    fontSize: 28,
    color: COLORS.charcoal,
    letterSpacing: -0.3,
  },
  dateText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textTertiary,
    marginTop: 4,
  },

  // ---- Section ----
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },

  // ---- Pet companions ribbon ----
  petsScroll: {
    gap: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  petMini: {
    alignItems: 'center',
    width: 72,
  },
  petMiniName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.charcoal,
    textAlign: 'center',
    marginTop: 6,
  },
  addPetCard: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
  },
  addPetCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
  },
  addPetLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 6,
  },

  // Empty pets state
  emptyPetsCard: {
    marginVertical: 0,
  },
  emptyPetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  emptyPetsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPetsText: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // ---- AI Assistant prompt card ----
  aiCard: {
    marginVertical: 0,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  aiIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTextBlock: {
    flex: 1,
  },
  aiTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.charcoal,
    lineHeight: 20,
  },
  aiSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textTertiary,
    marginTop: 2,
  },

  // ---- Feature cards row ----
  featuresRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  featureCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.sm,
    marginVertical: 0,
  },
  featureIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  featureTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.charcoal,
    textAlign: 'center',
    marginBottom: 2,
  },
  featureSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },

  // ---- Stats dashboard ----
  statsCard: {
    marginVertical: 0,
    paddingVertical: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  statsDivider: {
    width: 1,
    height: 50,
    backgroundColor: COLORS.borderLight,
  },

  // ---- Next booking ----
  bookingCard: {
    marginVertical: 0,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  bookingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingService: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.charcoal,
  },
  bookingDate: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bookingSitter: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 2,
  },

  // ---- Recent scans ----
  scanCard: {
    marginVertical: 3,
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  scanScoreBadge: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanScoreText: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  scanInfo: {
    flex: 1,
  },
  scanName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.charcoal,
  },
  scanBrand: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
});

export default HomeScreen;
