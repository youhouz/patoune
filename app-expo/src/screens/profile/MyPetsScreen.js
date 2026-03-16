// ─────────────────────────────────────────────────────────────────────────────
// Pépète — MyPetsScreen v3.0
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Platform, StatusBar,
  Animated, RefreshControl, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { PawIcon } from '../../components/Logo';
import { getMyPetsAPI, deletePetAPI } from '../../api/pets';
import { FONTS } from '../../utils/typography';
const colors = require('../../utils/colors');
const { SHADOWS, RADIUS, SPACING, FONT_SIZE } = require('../../utils/colors');

const SPECIES_CONFIG = {
  chien:   { emoji: '🐶', label: 'Chien',    gradient: ['#527A56', '#6B8F71'] },
  chat:    { emoji: '🐱', label: 'Chat',     gradient: ['#6B8F71', '#8CB092'] },
  rongeur: { emoji: '🐹', label: 'Rongeur',  gradient: ['#C4956A', '#D4AD86'] },
  oiseau:  { emoji: '🦜', label: 'Oiseau',   gradient: ['#8CB092', '#B0BEB2'] },
  reptile: { emoji: '🦎', label: 'Reptile',  gradient: ['#3D5E41', '#527A56'] },
  poisson: { emoji: '🐟', label: 'Poisson',  gradient: ['#B8A88A', '#D4C8AE'] },
  autre:   { emoji: '🐾', label: 'Autre',    gradient: ['#8A9A8C', '#B0BEB2'] },
};

const MyPetsScreen = ({ navigation }) => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      loadPets();
    }, [])
  );

  const loadPets = async () => {
    try {
      const response = await getMyPetsAPI();
      const data = response.data?.pets || response.data || [];
      setPets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('Erreur chargement animaux:', err);
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
      `Supprimer ${pet.name} ?`,
      'Cette action est irréversible.',
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
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer cet animal.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const getAgeLabel = (age) => {
    if (age == null) return null;
    if (age === 0) return '< 1 an';
    return `${age} an${age > 1 ? 's' : ''}`;
  };

  const renderPetCard = ({ item }) => {
    const config = SPECIES_CONFIG[item.species] || SPECIES_CONFIG.autre;
    const isDeleting = deletingId === item._id;
    const photo = item.photos?.[0];

    return (
      <Animated.View style={[styles.card, isDeleting && { opacity: 0.4 }]}>
        <LinearGradient
          colors={config.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardBar}
        />
        <View style={styles.cardBody}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatarPhoto} resizeMode="cover" />
            ) : (
              <LinearGradient
                colors={config.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarEmoji}>{config.emoji}</Text>
              </LinearGradient>
            )}
          </View>

          {/* Infos */}
          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.petName} numberOfLines={1}>{item.name}</Text>
              {item.gender && (
                <View style={[styles.genderDot, { backgroundColor: item.gender === 'male' ? '#EFF5F0' : '#FDF5ED' }]}>
                  <Text style={[styles.genderIcon, { color: item.gender === 'male' ? '#8CB092' : '#C4956A' }]}>
                    {item.gender === 'male' ? '♂' : '♀'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.petBreed} numberOfLines={1}>
              {config.label}{item.breed ? ` · ${item.breed}` : ''}
            </Text>
            <View style={styles.chips}>
              {getAgeLabel(item.age) && (
                <View style={styles.chip}>
                  <Feather name="calendar" size={11} color={colors.textTertiary} />
                  <Text style={styles.chipText}>{getAgeLabel(item.age)}</Text>
                </View>
              )}
              {item.weight != null && (
                <View style={styles.chip}>
                  <Feather name="activity" size={11} color={colors.textTertiary} />
                  <Text style={styles.chipText}>{item.weight} kg</Text>
                </View>
              )}
              <View style={[styles.chip, item.vaccinated ? styles.chipGreen : styles.chipOrange]}>
                <Feather
                  name={item.vaccinated ? 'check-circle' : 'alert-circle'}
                  size={11}
                  color={item.vaccinated ? colors.success : colors.warning}
                />
                <Text style={[styles.chipText, { color: item.vaccinated ? colors.success : colors.warning }]}>
                  {item.vaccinated ? 'Vacciné' : 'Non vacciné'}
                </Text>
              </View>
              {item.sterilized && (
                <View style={[styles.chip, styles.chipGreen]}>
                  <Feather name="scissors" size={11} color={colors.success} />
                  <Text style={[styles.chipText, { color: colors.success }]}>Stérilisé</Text>
                </View>
              )}
            </View>
            {item.specialNeeds ? (
              <View style={styles.needsRow}>
                <Feather name="info" size={11} color={colors.warning} />
                <Text style={styles.needsText} numberOfLines={1}>{item.specialNeeds}</Text>
              </View>
            ) : null}
          </View>

          {/* Actions edit / delete */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('AddPet', { pet: item })}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="edit-2" size={14} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item)}
              disabled={isDeleting}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isDeleting
                ? <ActivityIndicator size="small" color={colors.error} />
                : <Feather name="trash-2" size={14} color={colors.error} />
              }
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <LinearGradient
        colors={['#527A56', '#6B8F71']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emptyIcon}
      >
        <PawIcon size={44} color="#FFF" />
      </LinearGradient>
      <Text style={styles.emptyTitle}>Aucun animal</Text>
      <Text style={styles.emptySub}>
        Ajoutez votre premier compagnon{'\n'}pour commencer l'aventure Pépète
      </Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => navigation.navigate('AddPet')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[colors.primaryDark, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.emptyBtnGrad}
        >
          <Feather name="plus" size={16} color="#FFF" />
          <Text style={styles.emptyBtnText}>Ajouter mon premier animal</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1C2B1E', '#2C3E2F', '#3D5E41']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Mes animaux</Text>
            {pets.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{pets.length}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddPet')}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={18} color="#FFF" />
            <Text style={styles.addBtnText}>Ajouter</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {pets.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          data={pets}
          renderItem={renderPetCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: SPACING.md,
  },
  loadingText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.base,
    color: colors.textSecondary,
  },

  // Header gradient
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontFamily: FONTS.brand,
    fontSize: FONT_SIZE.xl,
    color: '#FFF',
    letterSpacing: -0.4,
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  countBadgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.9)',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  addBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.sm,
    color: '#FFF',
  },

  // List
  list: {
    padding: SPACING.base,
    paddingTop: SPACING.xl,
    gap: SPACING.md,
  },

  // Pet card
  card: {
    backgroundColor: colors.white,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  cardBar: { height: 3 },
  cardBody: {
    flexDirection: 'row',
    padding: SPACING.base,
    alignItems: 'flex-start',
    gap: SPACING.base,
  },

  // Avatar
  avatarWrap: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarPhoto: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.xl,
  },
  avatarGradient: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 28 },

  // Card info
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  petName: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.lg,
    color: colors.text,
    flexShrink: 1,
    letterSpacing: -0.3,
  },
  genderDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderIcon: {
    fontSize: 13,
    fontWeight: '700',
  },
  petBreed: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  chipGreen: { backgroundColor: '#EFF5F0' },
  chipOrange: { backgroundColor: '#FDF5ED' },
  chipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.xs,
    color: colors.textSecondary,
  },
  needsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: SPACING.xs,
  },
  needsText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.xs,
    color: colors.warning,
    flex: 1,
  },

  // Actions
  actions: {
    gap: SPACING.sm,
    alignItems: 'center',
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.lg,
    backgroundColor: '#FBE8E4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['2xl'],
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  emptyTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE['2xl'],
    color: colors.text,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  emptySub: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING['2xl'],
  },
  emptyBtn: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  emptyBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING['2xl'],
    gap: SPACING.sm,
  },
  emptyBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.base,
    color: '#FFF',
  },
});

export default MyPetsScreen;
