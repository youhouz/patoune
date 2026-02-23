import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getMyPetsAPI, deletePetAPI } from '../../api/pets';
import { FONTS } from '../../utils/typography';
const { COLORS, SHADOWS, RADIUS, SPACING, FONT_SIZE } = require('../../utils/colors');

const SPECIES_CONFIG = {
  chien: { icon: 'gitlab', label: 'Chien', gradient: COLORS.gradientPrimary },
  chat: { icon: 'github', label: 'Chat', gradient: [COLORS.accent, COLORS.accentLight] },
  rongeur: { icon: 'mouse-pointer', label: 'Rongeur', gradient: [COLORS.warning, '#E0B85C'] },
  oiseau: { icon: 'feather', label: 'Oiseau', gradient: [COLORS.secondary, COLORS.secondaryLight] },
  reptile: { icon: 'zap', label: 'Reptile', gradient: [COLORS.success, '#7AB88A'] },
  poisson: { icon: 'droplet', label: 'Poisson', gradient: [COLORS.info, '#7A9EBB'] },
  autre: { icon: 'heart', label: 'Autre', gradient: [COLORS.pebble, COLORS.sand] },
};

const MyPetsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fabAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadPets();
    }, [])
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadPets = async () => {
    setError(null);
    try {
      const response = await getMyPetsAPI();
      const data = response.data?.pets || response.data || [];
      setPets(Array.isArray(data) ? data : []);

      // Animate FAB after data loads
      Animated.spring(fabAnim, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.log('Erreur chargement animaux:', err);
      setError('Impossible de charger vos animaux. Tirez pour reessayer.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPets();
  }, []);

  const handleDelete = (pet) => {
    Alert.alert(
      'Supprimer cet animal',
      `Etes-vous sur de vouloir supprimer ${pet.name} ?\nCette action est irreversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(pet._id);
            try {
              await deletePetAPI(pet._id);
              setPets((prev) => prev.filter((p) => p._id !== pet._id));
            } catch (err) {
              Alert.alert('Erreur', 'Impossible de supprimer cet animal. Reessayez.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const getAge = (age) => {
    if (age == null) return null;
    if (age === 0) return '< 1 an';
    return `${age} an${age > 1 ? 's' : ''}`;
  };

  const renderPetCard = ({ item, index }) => {
    const config = SPECIES_CONFIG[item.species] || SPECIES_CONFIG.autre;
    const isDeleting = deletingId === item._id;

    return (
      <Animated.View
        style={[
          styles.petCard,
          {
            opacity: isDeleting ? 0.5 : fadeAnim,
          },
        ]}
      >
        {/* Colored top accent bar */}
        <LinearGradient
          colors={config.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardAccent}
        />

        {/* Pet Header Row */}
        <View style={styles.petHeader}>
          <View style={styles.speciesIconContainer}>
            <LinearGradient
              colors={config.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.speciesIconGradient}
            >
              <Feather name={config.icon} size={26} color={COLORS.white} />
            </LinearGradient>
          </View>

          <View style={styles.petInfo}>
            <View style={styles.petNameRow}>
              <Text style={styles.petName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.gender && (
                <View
                  style={[
                    styles.genderBadge,
                    {
                      backgroundColor:
                        item.gender === 'male' ? '#EFF6FF' : '#FDF2F8',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.genderText,
                      {
                        color: item.gender === 'male' ? '#3B82F6' : '#EC4899',
                      },
                    ]}
                  >
                    {item.gender === 'male' ? '\u2642' : '\u2640'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.petBreed} numberOfLines={1}>
              {config.label}
              {item.breed ? ` - ${item.breed}` : ''}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={COLORS.error} />
            ) : (
              <Feather name="x" size={14} color={COLORS.error} />
            )}
          </TouchableOpacity>
        </View>

        {/* Details Chips */}
        <View style={styles.detailsRow}>
          {getAge(item.age) && (
            <View style={styles.detailChip}>
              <Feather name="gift" size={12} color={COLORS.pebble} />
              <Text style={styles.detailChipText}>{getAge(item.age)}</Text>
            </View>
          )}
          {item.weight != null && (
            <View style={styles.detailChip}>
              <Feather name="bar-chart" size={12} color={COLORS.pebble} />
              <Text style={styles.detailChipText}>{item.weight} kg</Text>
            </View>
          )}
          {item.vaccinated && (
            <View style={[styles.detailChip, styles.vaccinatedChip]}>
              <Feather name="shield" size={12} color={COLORS.success} />
              <Text style={[styles.detailChipText, styles.vaccinatedText]}>
                Vaccine
              </Text>
            </View>
          )}
          {!item.vaccinated && (
            <View style={[styles.detailChip, styles.notVaccinatedChip]}>
              <Feather name="alert-triangle" size={12} color={COLORS.warning} />
              <Text style={[styles.detailChipText, styles.notVaccinatedText]}>
                Non vaccine
              </Text>
            </View>
          )}
        </View>

        {/* Special Needs */}
        {item.specialNeeds ? (
          <View style={styles.specialNeedsContainer}>
            <Text style={styles.specialNeedsLabel}>Besoins particuliers</Text>
            <Text style={styles.specialNeedsText} numberOfLines={2}>
              {item.specialNeeds}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <LinearGradient
          colors={COLORS.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyIconGradient}
        >
          <Feather name="heart" size={44} color={COLORS.white} />
        </LinearGradient>
      </View>
      <Text style={styles.emptyTitle}>Aucun animal</Text>
      <Text style={styles.emptySubtitle}>
        Ajoutez votre premier compagnon{'\n'}pour commencer l'aventure Patoune
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('AddPet')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={COLORS.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.emptyButtonGradient}
        >
          <Feather name="plus" size={16} color={COLORS.white} />
          <Text style={styles.emptyButtonText}>Ajouter mon premier animal</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.errorIconContainer}>
        <Feather name="frown" size={44} color={COLORS.warning} />
      </View>
      <Text style={styles.emptyTitle}>Oups !</Text>
      <Text style={styles.emptySubtitle}>{error}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => {
          setLoading(true);
          loadPets();
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.retryButtonText}>Reessayer</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement de vos animaux...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={COLORS.charcoal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes animaux</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{pets.length}</Text>
        </View>
      </View>

      {error ? (
        renderErrorState()
      ) : pets.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <FlatList
            data={pets}
            renderItem={renderPetCard}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />

          {/* FAB */}
          <Animated.View
            style={[
              styles.fab,
              {
                transform: [
                  {
                    scale: fabAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ],
                opacity: fabAnim,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => navigation.navigate('AddPet')}
              activeOpacity={0.85}
              style={styles.fabTouchable}
            >
              <LinearGradient
                colors={COLORS.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fabGradient}
              >
                <Feather name="plus" size={28} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
  },
  loadingText: {
    marginTop: SPACING.base,
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.stone,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACING.base,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.cream,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontFamily: FONTS.heading,
    color: COLORS.charcoal,
    marginLeft: SPACING.base,
    letterSpacing: 0.2,
  },
  headerBadge: {
    backgroundColor: COLORS.primarySoft,
    minWidth: 32,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  headerBadgeText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.heading,
    color: COLORS.primary,
  },

  // List
  list: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  separator: {
    height: SPACING.base,
  },

  // Pet Card
  petCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  cardAccent: {
    height: 4,
  },
  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  speciesIconContainer: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  speciesIconGradient: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  petNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  petName: {
    fontSize: FONT_SIZE.lg,
    fontFamily: FONTS.heading,
    color: COLORS.charcoal,
  },
  genderBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderText: {
    fontSize: 14,
    fontFamily: FONTS.heading,
  },
  petBreed: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.stone,
    marginTop: 2,
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Details
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.linen,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  detailChipText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.stone,
  },
  vaccinatedChip: {
    backgroundColor: COLORS.successSoft,
  },
  vaccinatedText: {
    color: COLORS.success,
  },
  notVaccinatedChip: {
    backgroundColor: COLORS.warningSoft,
  },
  notVaccinatedText: {
    color: COLORS.warning,
  },

  // Special Needs
  specialNeedsContainer: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.base,
    padding: SPACING.md,
    backgroundColor: COLORS.linen,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  specialNeedsLabel: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.stone,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  specialNeedsText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.body,
    color: COLORS.charcoal,
    lineHeight: 20,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING['3xl'],
  },
  emptyIconContainer: {
    marginBottom: SPACING.xl,
    borderRadius: 50,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontFamily: FONTS.heading,
    color: COLORS.charcoal,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.body,
    color: COLORS.stone,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING['2xl'],
  },
  emptyButton: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.glow(COLORS.primary),
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING['2xl'],
    borderRadius: RADIUS.xl,
    gap: SPACING.sm,
  },
  emptyButtonText: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.heading,
    color: COLORS.white,
  },

  // Error State
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING['2xl'],
    borderRadius: RADIUS.xl,
  },
  retryButtonText: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.heading,
    color: COLORS.white,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 32,
    right: SPACING.lg,
    ...SHADOWS.glow(COLORS.primary),
  },
  fabTouchable: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MyPetsScreen;
