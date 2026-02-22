import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Platform, Animated, ActivityIndicator, StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getPetSitterAPI, getPetSitterReviewsAPI } from '../../api/petsitters';
const colors = require('../../utils/colors');
const { SHADOWS, RADIUS, SPACING, FONT_SIZE } = require('../../utils/colors');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOP_PADDING = Platform.OS === 'ios' ? 58 : 48;

const ANIMAL_EMOJI_MAP = {
  chien: '🐶',
  chat: '🐱',
  rongeur: '🐹',
  oiseau: '🐦',
  reptile: '🦎',
};

const SERVICE_ICONS = {
  garde_domicile: { icon: '🏠', label: 'Garde a domicile', desc: 'Votre animal reste chez vous' },
  garde_chez_sitter: { icon: '🏡', label: 'Garde chez le gardien', desc: 'Votre animal sejourne chez le gardien' },
  promenade: { icon: '🦮', label: 'Promenade', desc: 'Balade quotidienne' },
  visite: { icon: '👋', label: 'Visite a domicile', desc: 'Passage pour nourrir et cajoler' },
  toilettage: { icon: '✨', label: 'Toilettage', desc: 'Soin et beaute' },
};

const AVAILABILITY_DAYS = [
  { key: 'lun', label: 'L' },
  { key: 'mar', label: 'M' },
  { key: 'mer', label: 'M' },
  { key: 'jeu', label: 'J' },
  { key: 'ven', label: 'V' },
  { key: 'sam', label: 'S' },
  { key: 'dim', label: 'D' },
];

/* ---------- Star Rating ---------- */
const StarRating = ({ rating, size = 16, showValue = false, light = false }) => {
  const stars = [];
  const fullStars = Math.floor(rating || 0);
  const hasHalf = (rating || 0) - fullStars >= 0.5;
  const emptyColor = light ? 'rgba(255,255,255,0.3)' : colors.border;
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<Text key={i} style={{ fontSize: size, color: '#F59E0B' }}>★</Text>);
    } else if (i === fullStars && hasHalf) {
      stars.push(<Text key={i} style={{ fontSize: size, color: '#F59E0B' }}>★</Text>);
    } else {
      stars.push(<Text key={i} style={{ fontSize: size, color: emptyColor }}>★</Text>);
    }
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {stars}
      {showValue && (
        <Text style={{
          fontSize: size - 2,
          fontWeight: '700',
          color: '#F59E0B',
          marginLeft: 4,
        }}>
          {(rating || 0).toFixed(1)}
        </Text>
      )}
    </View>
  );
};

/* ---------- Rating Distribution Bar ---------- */
const RatingBar = ({ stars, count, total }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={styles.ratingBarRow}>
      <Text style={styles.ratingBarLabel}>{stars}</Text>
      <Text style={styles.ratingBarStar}>★</Text>
      <View style={styles.ratingBarTrack}>
        <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.ratingBarCount}>{count}</Text>
    </View>
  );
};

/* ---------- Section Card ---------- */
const SectionCard = ({ title, icon, children, style }) => (
  <View style={[styles.sectionCard, style]}>
    <View style={styles.sectionHeader}>
      {icon && <Text style={styles.sectionIcon}>{icon}</Text>}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

/* ---------- Main Screen ---------- */
const PetSitterDetailScreen = ({ route, navigation }) => {
  const [petsitter, setPetsitter] = useState(route.params?.petsitter || null);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (!petsitter && route.params?.petsitterId) {
      fetchPetSitter();
    }
    loadReviews();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchPetSitter = async () => {
    try {
      const response = await getPetSitterAPI(route.params.petsitterId);
      setPetsitter(response.data.petsitter || response.data);
    } catch (error) {
      console.log('Erreur chargement gardien:', error);
    }
  };

  const loadReviews = async () => {
    setLoadingReviews(true);
    try {
      const id = petsitter?._id || route.params?.petsitterId;
      if (id) {
        const response = await getPetSitterReviewsAPI(id);
        setReviews(response.data.reviews || []);
      }
    } catch (error) {
      console.log('Erreur reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  if (!petsitter) {
    return (
      <View style={styles.loadingFull}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingFullText}>Chargement du profil...</Text>
      </View>
    );
  }

  const initial = petsitter.user?.name?.charAt(0)?.toUpperCase() || '?';
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  // Rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => Math.floor(r.rating) === stars).length,
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backBtnIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.heroContent}>
            {/* Avatar */}
            <View style={styles.heroAvatarContainer}>
              <View style={styles.heroAvatar}>
                <Text style={styles.heroAvatarLetter}>{initial}</Text>
              </View>
              {petsitter.verified && (
                <View style={styles.heroVerifiedDot}>
                  <Text style={styles.heroVerifiedCheck}>✓</Text>
                </View>
              )}
            </View>

            {/* Name */}
            <Text style={styles.heroName}>
              {petsitter.user?.name || 'Gardien'}
            </Text>

            {/* Rating */}
            <View style={styles.heroRatingRow}>
              <StarRating rating={petsitter.rating} size={18} showValue light />
              <Text style={styles.heroReviewCount}>
                ({petsitter.reviewCount || 0} avis)
              </Text>
            </View>

            {/* Verified Badge */}
            {petsitter.verified && (
              <View style={styles.heroVerifiedBadge}>
                <Text style={styles.heroVerifiedBadgeIcon}>✓</Text>
                <Text style={styles.heroVerifiedBadgeText}>Profil verifie</Text>
              </View>
            )}

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{petsitter.experience || 0}</Text>
                <Text style={styles.statLabel}>an{(petsitter.experience || 0) > 1 ? 's' : ''} exp.</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{petsitter.reviewCount || 0}</Text>
                <Text style={styles.statLabel}>avis</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{petsitter.acceptedAnimals?.length || 0}</Text>
                <Text style={styles.statLabel}>types</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Body */}
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}>
          {/* Bio */}
          {petsitter.bio ? (
            <SectionCard title="A propos" icon="📝">
              <Text style={styles.bioText}>{petsitter.bio}</Text>
            </SectionCard>
          ) : null}

          {/* Pricing */}
          <SectionCard title="Tarifs" icon="💰">
            <View style={styles.pricingRow}>
              <View style={styles.priceCard}>
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.priceCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.priceCardIcon}>🌙</Text>
                  <Text style={styles.priceCardAmount}>
                    {petsitter.pricePerDay || '--'} EUR
                  </Text>
                  <Text style={styles.priceCardUnit}>par jour</Text>
                </LinearGradient>
              </View>
              <View style={styles.priceCard}>
                <LinearGradient
                  colors={colors.gradientAccent}
                  style={styles.priceCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.priceCardIcon}>⏰</Text>
                  <Text style={styles.priceCardAmount}>
                    {petsitter.pricePerHour || '--'} EUR
                  </Text>
                  <Text style={styles.priceCardUnit}>par heure</Text>
                </LinearGradient>
              </View>
            </View>
          </SectionCard>

          {/* Services */}
          {petsitter.services?.length > 0 && (
            <SectionCard title="Services proposes" icon="🛎️">
              <View style={styles.servicesList}>
                {petsitter.services.map((serviceKey, idx) => {
                  const serviceInfo = SERVICE_ICONS[serviceKey] || {
                    icon: '📌',
                    label: serviceKey.replace(/_/g, ' '),
                    desc: '',
                  };
                  return (
                    <View key={idx} style={styles.serviceItem}>
                      <View style={styles.serviceIconBox}>
                        <Text style={styles.serviceItemIcon}>{serviceInfo.icon}</Text>
                      </View>
                      <View style={styles.serviceItemInfo}>
                        <Text style={styles.serviceItemLabel}>{serviceInfo.label}</Text>
                        {serviceInfo.desc ? (
                          <Text style={styles.serviceItemDesc}>{serviceInfo.desc}</Text>
                        ) : null}
                      </View>
                      <View style={styles.serviceCheckmark}>
                        <Text style={styles.serviceCheckmarkIcon}>✓</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </SectionCard>
          )}

          {/* Accepted Animals */}
          {petsitter.acceptedAnimals?.length > 0 && (
            <SectionCard title="Animaux acceptes" icon="🐾">
              <View style={styles.animalChips}>
                {petsitter.acceptedAnimals.map((animal, idx) => (
                  <View key={idx} style={styles.animalChip}>
                    <Text style={styles.animalChipEmoji}>
                      {ANIMAL_EMOJI_MAP[animal.toLowerCase()] || '🐾'}
                    </Text>
                    <Text style={styles.animalChipText}>
                      {animal.charAt(0).toUpperCase() + animal.slice(1)}
                    </Text>
                  </View>
                ))}
              </View>
            </SectionCard>
          )}

          {/* Availability */}
          <SectionCard title="Disponibilite" icon="📅">
            <View style={styles.availabilityRow}>
              {AVAILABILITY_DAYS.map((day, idx) => {
                const available = petsitter.availability?.includes(day.key) ?? (idx < 5);
                return (
                  <View key={day.key} style={[
                    styles.availabilityDay,
                    available && styles.availabilityDayActive,
                  ]}>
                    <Text style={[
                      styles.availabilityDayText,
                      available && styles.availabilityDayTextActive,
                    ]}>{day.label}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.availabilityHint}>
              Contactez le gardien pour confirmer sa disponibilite
            </Text>
          </SectionCard>

          {/* Reviews */}
          <SectionCard title={`Avis (${reviews.length})`} icon="⭐">
            {loadingReviews ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ paddingVertical: SPACING.xl }}
              />
            ) : reviews.length === 0 ? (
              <View style={styles.noReviewsContainer}>
                <Text style={styles.noReviewsIcon}>💬</Text>
                <Text style={styles.noReviewsText}>Pas encore d'avis</Text>
                <Text style={styles.noReviewsSubtext}>
                  Soyez le premier a laisser un avis !
                </Text>
              </View>
            ) : (
              <>
                {/* Rating Summary */}
                <View style={styles.ratingSummary}>
                  <View style={styles.ratingSummaryLeft}>
                    <Text style={styles.ratingSummaryValue}>
                      {(petsitter.rating || 0).toFixed(1)}
                    </Text>
                    <StarRating rating={petsitter.rating} size={14} />
                    <Text style={styles.ratingSummaryCount}>
                      {reviews.length} avis
                    </Text>
                  </View>
                  <View style={styles.ratingSummaryRight}>
                    {ratingDistribution.map((item) => (
                      <RatingBar
                        key={item.stars}
                        stars={item.stars}
                        count={item.count}
                        total={reviews.length}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.reviewsDivider} />

                {/* Review Items */}
                {displayedReviews.map((review, idx) => (
                  <View
                    key={review._id || idx}
                    style={[
                      styles.reviewItem,
                      idx < displayedReviews.length - 1 && styles.reviewItemBorder,
                    ]}
                  >
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewAuthorRow}>
                        <View style={styles.reviewAuthorAvatar}>
                          <Text style={styles.reviewAuthorInitial}>
                            {review.author?.name?.charAt(0)?.toUpperCase() || '?'}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.reviewAuthorName}>
                            {review.author?.name || 'Anonyme'}
                          </Text>
                          <Text style={styles.reviewDate}>
                            {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </Text>
                        </View>
                      </View>
                      <StarRating rating={review.rating} size={12} />
                    </View>
                    {review.comment ? (
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    ) : null}
                  </View>
                ))}

                {/* Show more/less */}
                {reviews.length > 3 && (
                  <TouchableOpacity
                    style={styles.showMoreBtn}
                    onPress={() => setShowAllReviews(!showAllReviews)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.showMoreText}>
                      {showAllReviews
                        ? 'Voir moins'
                        : `Voir les ${reviews.length} avis`}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </SectionCard>

          {/* Bottom spacer for sticky bar */}
          <View style={{ height: 110 }} />
        </Animated.View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarPriceCol}>
          <Text style={styles.bottomBarPriceLabel}>A partir de</Text>
          <View style={styles.bottomBarPriceRow}>
            <Text style={styles.bottomBarPrice}>{petsitter.pricePerDay || '--'} EUR</Text>
            <Text style={styles.bottomBarPriceUnit}>/jour</Text>
          </View>
        </View>

        <View style={styles.bottomBarActions}>
          <TouchableOpacity
            style={styles.contactBtn}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('Messages', {
                userId: petsitter.user?._id,
                userName: petsitter.user?.name,
              })
            }
          >
            <Text style={styles.contactBtnIcon}>💬</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Booking', { petsitter })}
            style={styles.bookBtnWrapper}
          >
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.bookBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.bookBtnText}>Reserver</Text>
              <Text style={styles.bookBtnArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingBottom: 0,
  },
  loadingFull: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: SPACING.md,
  },
  loadingFullText: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Hero
  hero: {
    paddingTop: TOP_PADDING,
    paddingBottom: SPACING['2xl'],
    paddingHorizontal: SPACING.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  backBtnIcon: {
    fontSize: 22,
    color: colors.white,
    fontWeight: '600',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroAvatarContainer: {
    position: 'relative',
    marginBottom: SPACING.base,
  },
  heroAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  heroAvatarLetter: {
    fontSize: FONT_SIZE['4xl'],
    fontWeight: '700',
    color: colors.white,
  },
  heroVerifiedDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  heroVerifiedCheck: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '700',
  },
  heroName: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.3,
    marginBottom: SPACING.sm,
  },
  heroRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  heroReviewCount: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  heroVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  heroVerifiedBadgeIcon: {
    fontSize: 12,
    color: '#34D399',
    fontWeight: '700',
  },
  heroVerifiedBadgeText: {
    fontSize: FONT_SIZE.sm,
    color: '#34D399',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: colors.white,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // Section Card
  sectionCard: {
    backgroundColor: colors.white,
    marginHorizontal: SPACING.base,
    marginTop: SPACING.base,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
    gap: SPACING.sm,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: colors.text,
  },

  // Bio
  bioText: {
    fontSize: FONT_SIZE.base,
    color: colors.textSecondary,
    lineHeight: 24,
  },

  // Pricing
  pricingRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  priceCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  priceCardGradient: {
    padding: SPACING.lg,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  },
  priceCardIcon: {
    fontSize: 24,
    marginBottom: SPACING.sm,
  },
  priceCardAmount: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 2,
  },
  priceCardUnit: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },

  // Services
  servicesList: {
    gap: SPACING.sm,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: colors.background,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  serviceIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  serviceItemIcon: {
    fontSize: 20,
  },
  serviceItemInfo: {
    flex: 1,
  },
  serviceItemLabel: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: colors.text,
  },
  serviceItemDesc: {
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  serviceCheckmark: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.full,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceCheckmarkIcon: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '700',
  },

  // Animals
  animalChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  animalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  animalChipEmoji: {
    fontSize: 18,
  },
  animalChipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: colors.primary,
  },

  // Availability
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  availabilityDay: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 44,
    borderRadius: RADIUS.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  availabilityDayActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  availabilityDayText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  availabilityDayTextActive: {
    color: '#10B981',
  },
  availabilityHint: {
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
    marginTop: SPACING.md,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Reviews
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  noReviewsIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  noReviewsText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  noReviewsSubtext: {
    fontSize: FONT_SIZE.sm,
    color: colors.textTertiary,
    marginTop: SPACING.xs,
  },

  // Rating Summary
  ratingSummary: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  ratingSummaryLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  ratingSummaryValue: {
    fontSize: FONT_SIZE['3xl'],
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  ratingSummaryCount: {
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
  ratingSummaryRight: {
    flex: 1,
    gap: 4,
  },

  // Rating Bar
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  ratingBarLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 10,
    textAlign: 'right',
  },
  ratingBarStar: {
    fontSize: 10,
    color: '#F59E0B',
  },
  ratingBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.background,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: RADIUS.full,
  },
  ratingBarCount: {
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
    width: 18,
    textAlign: 'right',
  },

  reviewsDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: SPACING.sm,
  },
  reviewItem: {
    paddingVertical: SPACING.md,
  },
  reviewItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  reviewAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  reviewAuthorAvatar: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAuthorInitial: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: colors.accent,
  },
  reviewAuthorName: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: colors.text,
  },
  reviewDate: {
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
    marginTop: 1,
  },
  reviewComment: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: 48,
  },
  showMoreBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.xs,
  },
  showMoreText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: colors.primary,
  },

  // Bottom Bar
  bottomBar: {
    backgroundColor: colors.white,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.base,
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.lg,
  },
  bottomBarPriceCol: {
    flex: 1,
  },
  bottomBarPriceLabel: {
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  bottomBarPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  bottomBarPrice: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: colors.text,
  },
  bottomBarPriceUnit: {
    fontSize: FONT_SIZE.sm,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  bottomBarActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  contactBtn: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.lg,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  contactBtnIcon: {
    fontSize: 22,
  },
  bookBtnWrapper: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    height: 50,
    ...SHADOWS.glow(),
  },
  bookBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: colors.white,
  },
  bookBtnArrow: {
    fontSize: FONT_SIZE.lg,
    color: colors.white,
    fontWeight: '600',
  },
});

export default PetSitterDetailScreen;
