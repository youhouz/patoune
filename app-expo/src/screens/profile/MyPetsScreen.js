import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  Animated,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { PawIcon } from '../../components/Logo';
import { getMyPetsAPI, deletePetAPI } from '../../api/pets';
const colors = require('../../utils/colors');
const { SHADOWS, RADIUS, SPACING, FONT_SIZE } = require('../../utils/colors');

const HEADER_PADDING_TOP = Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12;

const SPECIES_CONFIG = {
  chien: { letter: 'C', label: 'Chien', gradient: ['#527A56', '#6B8F71'] },
  chat: { letter: 'Ch', label: 'Chat', gradient: ['#6B8F71', '#8CB092'] },
  rongeur: { letter: 'R', label: 'Rongeur', gradient: ['#C4956A', '#D4AD86'] },
  oiseau: { letter: 'O', label: 'Oiseau', gradient: ['#8CB092', '#B0BEB2'] },
  reptile: { letter: 'Re', label: 'Reptile', gradient: ['#3D5E41', '#527A56'] },
  poisson: { letter: 'P', label: 'Poisson', gradient: ['#B8A88A', '#D4C8AE'] },
  autre: { letter: '?', label: 'Autre', gradient: ['#8A9A8C', '#B0BEB2'] },
};

const MyPetsScreen = ({ navigation }) => {
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
      setError('Impossible de charger vos animaux. Tirez pour réessayer.');
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
      `Êtes-vous sûr de vouloir supprimer ${pet.name} ?\nCette action est irréversible.`,
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
              Alert.alert('Erreur', 'Impossible de supprimer cet animal. Réessayez.');
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
              <Text style={styles.speciesIcon}>{config.letter}</Text>
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
                        item.gender === 'male' ? '#EFF5F0' : '#FDF5ED',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.genderText,
                      {
                        color: item.gender === 'male' ? '#8CB092' : '#C4956A',
                      },
                    ]}
                  >
                    {item.gender === 'male' ? '♂' : '♀'}
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
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Feather name="x" size={13} color={colors.error} />
            )}
          </TouchableOpacity>
        </View>

        {/* Details Chips */}
        <View style={styles.detailsRow}>
          {getAge(item.age) && (
            <View style={styles.detailChip}>
              <Feather name="gift" size={12} color={colors.textTertiary} />
              <Text style={styles.detailChipText}>{getAge(item.age)}</Text>
            </View>
          )}
          {item.weight != null && (
            <View style={styles.detailChip}>
              <Feather name="activity" size={12} color={colors.textTertiary} />
              <Text style={styles.detailChipText}>{item.weight} kg</Text>
            </View>
          )}
          {item.vaccinated && (
            <View style={[styles.detailChip, styles.vaccinatedChip]}>
              <Feather name="check-circle" size={12} color={colors.success} />
              <Text style={[styles.detailChipText, styles.vaccinatedText]}>
                Vacciné
              </Text>
            </View>
          )}
          {!item.vaccinated && (
            <View style={[styles.detailChip, styles.notVaccinatedChip]}>
              <Feather name="alert-triangle" size={12} color={colors.warning} />
              <Text style={[styles.detailChipText, styles.notVaccinatedText]}>
                Non vacciné
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
          colors={['#527A56', '#6B8F71']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyIconGradient}
        >
          <PawIcon size={44} color="#FFF" />
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
          colors={['#527A56', '#6B8F71']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.emptyButtonGradient}
        >
          <Feather name="plus" size={16} color="#FFF" />
          <Text style={styles.emptyButtonText}>Ajouter mon premier animal</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.errorIconContainer}>
        <Feather name="frown" size={44} color={colors.warning} />
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
        <Text style={styles.retryButtonText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement de vos animaux...</Text>
      </View>
    );
  }

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
                colors={[colors.primary]}
                tintColor={colors.primary}
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
                colors={['#527A56', '#6B8F71']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fabGradient}
              >
                <Feather name="plus" size={28} color="#FFF" />
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
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: SPACING.base,
    fontSize: FONT_SIZE.base,
    color: colors.textSecondary,
    fontWeight: '500',
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
    marginLeft: SPACING.base,
    letterSpacing: 0.2,
  },
  headerBadge: {
    backgroundColor: colors.primarySoft,
    minWidth: 32,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  headerBadgeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: colors.primary,
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
    backgroundColor: colors.white,
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
  speciesIcon: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
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
    fontWeight: '700',
    color: colors.text,
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
    fontWeight: '700',
  },
  petBreed: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: colors.errorSoft,
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
    backgroundColor: colors.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  detailChipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  vaccinatedChip: {
    backgroundColor: colors.successSoft,
  },
  vaccinatedText: {
    color: colors.success,
  },
  notVaccinatedChip: {
    backgroundColor: colors.warningSoft,
  },
  notVaccinatedText: {
    color: colors.warning,
  },

  // Special Needs
  specialNeedsContainer: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.base,
    padding: SPACING.md,
    backgroundColor: colors.background,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  specialNeedsLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  specialNeedsText: {
    fontSize: FONT_SIZE.sm,
    color: colors.text,
    fontWeight: '400',
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
    ...SHADOWS.glow('#527A56'),
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
    fontWeight: '800',
    color: colors.text,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING['2xl'],
  },
  emptyButton: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.glow('#527A56'),
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
    fontWeight: '700',
    color: colors.white,
  },

  // Error State
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING['2xl'],
    borderRadius: RADIUS.xl,
  },
  retryButtonText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: colors.white,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 32 : 24,
    right: SPACING.lg,
    ...SHADOWS.glow('#527A56'),
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
