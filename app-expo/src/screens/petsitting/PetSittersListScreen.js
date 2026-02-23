import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, TextInput, Platform, Animated, RefreshControl,
  StatusBar, Dimensions, Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { searchPetSittersAPI } from '../../api/petsitters';
import useLocation from '../../hooks/useLocation';
import { FONTS } from '../../utils/typography';
const colors = require('../../utils/colors');
const { SHADOWS, RADIUS, SPACING, FONT_SIZE } = require('../../utils/colors');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ANIMAL_FILTERS = [
  { key: 'Tous', icon: 'heart', label: 'Tous' },
  { key: 'Chien', icon: 'gitlab', label: 'Chiens' },
  { key: 'Chat', icon: 'github', label: 'Chats' },
  { key: 'Rongeur', icon: 'mouse-pointer', label: 'Rongeurs' },
  { key: 'Oiseau', icon: 'feather', label: 'Oiseaux' },
  { key: 'Reptile', icon: 'zap', label: 'Reptiles' },
];

const ANIMAL_ICON_MAP = {
  chien: 'gitlab',
  chat: 'github',
  rongeur: 'mouse-pointer',
  oiseau: 'feather',
  reptile: 'zap',
};

const RADIUS_FILTERS = [
  { key: 5, label: '5 km' },
  { key: 10, label: '10 km' },
  { key: 25, label: '25 km' },
  { key: 50, label: '50 km' },
];

/* ---------- Star Rating ---------- */
const StarRating = ({ rating, size = 14 }) => {
  const stars = [];
  const fullStars = Math.floor(rating || 0);
  const hasHalf = (rating || 0) - fullStars >= 0.5;
  for (let i = 0; i < 5; i++) {
    if (i < fullStars || (i === fullStars && hasHalf)) {
      stars.push(<Feather key={i} name="star" size={size} color="#F59E0B" />);
    } else {
      stars.push(<Feather key={i} name="star" size={size} color={colors.border} />);
    }
  }
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>{stars}</View>;
};

/* ---------- Skeleton Placeholder ---------- */
const SkeletonCard = ({ index }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View style={[styles.card, { opacity, marginTop: index === 0 ? SPACING.sm : 0 }]}>
      <View style={styles.cardContent}>
        <View style={[styles.skeletonCircle, { width: 56, height: 56, borderRadius: RADIUS['2xl'] }]} />
        <View style={{ flex: 1, gap: SPACING.sm, marginLeft: SPACING.md }}>
          <View style={[styles.skeletonLine, { width: '55%', height: 16 }]} />
          <View style={[styles.skeletonLine, { width: '35%', height: 12 }]} />
          <View style={[styles.skeletonLine, { width: '80%', height: 12 }]} />
          <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
            <View style={[styles.skeletonLine, { width: 54, height: 22, borderRadius: RADIUS.sm }]} />
            <View style={[styles.skeletonLine, { width: 54, height: 22, borderRadius: RADIUS.sm }]} />
          </View>
        </View>
        <View style={[styles.skeletonLine, { width: 56, height: 64, borderRadius: RADIUS.md }]} />
      </View>
    </Animated.View>
  );
};

/* ---------- Pet Sitter Card ---------- */
const PetSitterCard = ({ petsitter, onPress, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.975,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const initial = petsitter.user?.name?.charAt(0)?.toUpperCase() || '?';
  const bio = petsitter.bio || '';
  const bioPreview = bio.length > 90 ? bio.substring(0, 90) + '...' : bio;
  const priceDisplay = petsitter.pricePerDay ? `${petsitter.pricePerDay}` : '--';

  return (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
    }}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <View style={styles.cardContent}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {petsitter.user?.avatar ? (
              <Image source={{ uri: petsitter.user.avatar }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={[colors.primary, colors.primaryLight]}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarLetter}>{initial}</Text>
              </LinearGradient>
            )}
            {petsitter.verified && (
              <View style={styles.verifiedDot}>
                <Feather name="check" size={10} color={colors.white} />
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <View style={styles.cardNameRow}>
              <Text style={styles.cardName} numberOfLines={1}>
                {petsitter.user?.name || 'Gardien'}
              </Text>
              {petsitter.verified && (
                <View style={styles.verifiedBadge}>
                  <Feather name="check-circle" size={9} color="#10B981" />
                  <Text style={styles.verifiedBadgeText}>Verifie</Text>
                </View>
              )}
            </View>

            <View style={styles.ratingRow}>
              <StarRating rating={petsitter.rating} size={13} />
              <Text style={styles.ratingText}>
                {petsitter.rating?.toFixed(1) || '0.0'}
              </Text>
              <Text style={styles.reviewCount}>
                ({petsitter.reviewCount || 0})
              </Text>
              {petsitter.experience > 0 && (
                <View style={styles.expBadge}>
                  <Text style={styles.expText}>{petsitter.experience} an{petsitter.experience > 1 ? 's' : ''}</Text>
                </View>
              )}
            </View>

            {bioPreview ? (
              <Text style={styles.bioPreview} numberOfLines={2}>
                {bioPreview}
              </Text>
            ) : null}

            {/* Distance if available */}
            {petsitter.distance != null && (
              <View style={styles.distanceRow}>
                <Feather name="map-pin" size={11} color={colors.secondary} />
                <Text style={styles.distanceText}>
                  {petsitter.distance < 1
                    ? `${Math.round(petsitter.distance * 1000)} m`
                    : `${petsitter.distance.toFixed(1)} km`}
                </Text>
              </View>
            )}

            {/* Accepted animals */}
            <View style={styles.animalTags}>
              {petsitter.acceptedAnimals?.slice(0, 4).map((animal, idx) => (
                <View key={idx} style={styles.animalTag}>
                  <Feather
                    name={ANIMAL_ICON_MAP[animal.toLowerCase()] || 'heart'}
                    size={11}
                    color={colors.primary}
                  />
                  <Text style={styles.animalTagText}>
                    {animal.charAt(0).toUpperCase() + animal.slice(1)}
                  </Text>
                </View>
              ))}
              {(petsitter.acceptedAnimals?.length || 0) > 4 && (
                <View style={[styles.animalTag, styles.animalTagMore]}>
                  <Text style={styles.animalTagText}>
                    +{petsitter.acceptedAnimals.length - 4}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Price */}
          <View style={styles.priceBox}>
            <Text style={styles.priceAmount}>{priceDisplay}</Text>
            <Text style={styles.priceCurrency}>EUR</Text>
            <View style={styles.priceDivider} />
            <Text style={styles.priceUnit}>/jour</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ---------- Main Screen ---------- */
const PetSittersListScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [petsitters, setPetsitters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState('Tous');
  const [selectedRadius, setSelectedRadius] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const { location, city, loading: locationLoading, requestLocation } = useLocation();

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    loadPetSitters();
  }, [selectedAnimal, location, selectedRadius]);

  const loadPetSitters = async () => {
    if (!refreshing) setLoading(true);
    try {
      const params = {};
      if (selectedAnimal !== 'Tous') {
        params.animal = selectedAnimal.toLowerCase();
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (location) {
        params.lat = location.latitude;
        params.lng = location.longitude;
        params.radius = selectedRadius;
      }
      const response = await searchPetSittersAPI(params);
      setPetsitters(response.data.petsitters || []);
    } catch (error) {
      console.log('Erreur chargement gardiens:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPetSitters();
  }, [selectedAnimal, searchQuery, location, selectedRadius]);

  const filteredPetsitters = petsitters.filter((ps) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ps.user?.name?.toLowerCase().includes(q) ||
      ps.bio?.toLowerCase().includes(q)
    );
  });

  const renderFilterChip = ({ item }) => {
    const isActive = selectedAnimal === item.key;
    return (
      <TouchableOpacity
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => setSelectedAnimal(item.key)}
        activeOpacity={0.7}
      >
        {isActive ? (
          <LinearGradient
            colors={colors.gradientPrimary}
            style={styles.filterChipGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Feather name={item.icon} size={15} color={colors.white} />
            <Text style={[styles.filterText, styles.filterTextActive]}>
              {item.label}
            </Text>
          </LinearGradient>
        ) : (
          <View style={styles.filterChipInner}>
            <Feather name={item.icon} size={15} color={colors.textSecondary} />
            <Text style={styles.filterText}>{item.label}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Gradient Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>Gardiens</Text>
            <Text style={styles.headerSubtitle}>
              De confiance pour vos compagnons
            </Text>
          </View>
          {/* Location indicator */}
          <TouchableOpacity
            style={styles.locationBadge}
            onPress={requestLocation}
            activeOpacity={0.7}
          >
            <Feather
              name="map-pin"
              size={14}
              color={city ? colors.white : 'rgba(255,255,255,0.6)'}
            />
            <Text style={styles.locationText} numberOfLines={1}>
              {locationLoading ? 'Localisation...' : city || 'Localiser'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, searchFocused && styles.searchContainerFocused]}>
          <Feather name="search" size={17} color={colors.textTertiary} style={{ marginRight: SPACING.sm }} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Nom, specialite..."
            placeholderTextColor={colors.textTertiary}
            returnKeyType="search"
            onSubmitEditing={loadPetSitters}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => { setSearchQuery(''); }}
              style={styles.searchClear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Filter Chips */}
      <View style={styles.filtersSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={ANIMAL_FILTERS}
          keyExtractor={(item) => item.key}
          renderItem={renderFilterChip}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Radius Filter Pills (only when location is available) */}
      {location && (
        <View style={styles.radiusSection}>
          <Feather name="target" size={13} color={colors.textTertiary} style={{ marginRight: SPACING.sm }} />
          {RADIUS_FILTERS.map((rf) => {
            const isActive = selectedRadius === rf.key;
            return (
              <TouchableOpacity
                key={rf.key}
                style={[styles.radiusPill, isActive && styles.radiusPillActive]}
                onPress={() => setSelectedRadius(rf.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.radiusPillText, isActive && styles.radiusPillTextActive]}>
                  {rf.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Results count */}
      {!loading && (
        <View style={styles.resultsCount}>
          <Text style={styles.resultsText}>
            {filteredPetsitters.length} gardien{filteredPetsitters.length !== 1 ? 's' : ''} disponible{filteredPetsitters.length !== 1 ? 's' : ''}
          </Text>
          {selectedAnimal !== 'Tous' && (
            <TouchableOpacity
              onPress={() => setSelectedAnimal('Tous')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.clearFilterText}>Effacer le filtre</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const renderSkeletons = () => (
    <View>
      {renderHeader()}
      <View style={{ paddingTop: SPACING.xs }}>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} index={i} />
        ))}
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Feather name="search" size={40} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Aucun gardien trouve</Text>
        <Text style={styles.emptySubtext}>
          Essayez de modifier vos filtres{'\n'}ou d'elargir votre recherche
        </Text>
        <TouchableOpacity
          style={styles.emptyResetBtn}
          onPress={() => {
            setSelectedAnimal('Tous');
            setSearchQuery('');
          }}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={colors.gradientPrimary}
            style={styles.emptyResetGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.emptyResetText}>Reinitialiser</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {loading && !refreshing ? (
        <View style={{ flex: 1 }}>
          {renderSkeletons()}
        </View>
      ) : (
        <FlatList
          data={filteredPetsitters}
          renderItem={({ item, index }) => (
            <PetSitterCard
              petsitter={item}
              index={index}
              onPress={() => navigation.navigate('PetSitterDetail', { petsitter: item })}
            />
          )}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
              progressViewOffset={10}
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZE['3xl'],
    fontFamily: FONTS.brand,
    color: colors.white,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodyMedium,
    color: 'rgba(255,255,255,0.75)',
    marginTop: SPACING.xs,
  },

  // Location badge
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
    maxWidth: 160,
  },
  locationText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodySemiBold,
    color: colors.white,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: RADIUS.xl,
    marginTop: SPACING.base,
    paddingHorizontal: SPACING.base,
    height: 50,
    ...SHADOWS.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  searchContainerFocused: {
    borderColor: 'rgba(255,255,255,0.5)',
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.body,
    color: colors.text,
    paddingVertical: 0,
  },
  searchClear: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filters
  filtersSection: {
    backgroundColor: colors.white,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filterList: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
  },
  filterChip: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  filterChipActive: {
    borderColor: colors.primary,
    ...SHADOWS.glow(),
  },
  filterChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.xs,
  },
  filterChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.xs,
  },
  filterText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },

  // Radius filter
  radiusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  radiusPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    backgroundColor: colors.background,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  radiusPillActive: {
    backgroundColor: colors.secondarySoft,
    borderColor: colors.secondary,
  },
  radiusPillText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodySemiBold,
    color: colors.textTertiary,
  },
  radiusPillTextActive: {
    color: colors.secondary,
  },

  // Results count
  resultsCount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.xs,
  },
  resultsText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    color: colors.textTertiary,
  },
  clearFilterText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    color: colors.primary,
  },

  // List
  list: {
    paddingBottom: SPACING['3xl'] + 20,
  },

  // Card
  card: {
    backgroundColor: colors.white,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.xl,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardContent: {
    flexDirection: 'row',
    padding: SPACING.base,
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: RADIUS['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: FONT_SIZE.xl,
    fontFamily: FONTS.heading,
    color: colors.white,
  },
  verifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: RADIUS.full,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: colors.white,
  },
  cardInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 4,
  },
  cardName: {
    fontSize: FONT_SIZE.md,
    fontFamily: FONTS.heading,
    color: colors.text,
    flexShrink: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    gap: 3,
  },
  verifiedBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodySemiBold,
    color: '#10B981',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  ratingText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.heading,
    color: colors.text,
  },
  reviewCount: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.body,
    color: colors.textTertiary,
  },
  expBadge: {
    backgroundColor: colors.infoSoft,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
    marginLeft: SPACING.xs,
  },
  expText: {
    fontSize: FONT_SIZE.xs - 1,
    fontFamily: FONTS.bodySemiBold,
    color: colors.info,
  },
  bioPreview: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.body,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: SPACING.sm,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.sm,
  },
  distanceText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
    color: colors.secondary,
  },
  animalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  animalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    gap: 3,
  },
  animalTagMore: {
    backgroundColor: colors.background,
  },
  animalTagText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
    color: colors.primary,
  },
  priceBox: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    minWidth: 62,
  },
  priceAmount: {
    fontSize: FONT_SIZE.xl,
    fontFamily: FONTS.heading,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  priceCurrency: {
    fontSize: 10,
    fontFamily: FONTS.heading,
    color: colors.primary,
    marginTop: -2,
    letterSpacing: 0.5,
  },
  priceDivider: {
    width: 20,
    height: 1,
    backgroundColor: colors.primary + '30',
    marginVertical: 4,
  },
  priceUnit: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
    color: colors.textTertiary,
  },

  // Skeleton
  skeletonCircle: {
    backgroundColor: colors.border,
  },
  skeletonLine: {
    backgroundColor: colors.border,
    borderRadius: RADIUS.xs,
    height: 14,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodyMedium,
    color: colors.textSecondary,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: SPACING['5xl'],
    paddingHorizontal: SPACING['2xl'],
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontFamily: FONTS.heading,
    color: colors.text,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  emptyResetBtn: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  emptyResetGradient: {
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.full,
  },
  emptyResetText: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.heading,
    color: colors.white,
  },
});

export default PetSittersListScreen;
