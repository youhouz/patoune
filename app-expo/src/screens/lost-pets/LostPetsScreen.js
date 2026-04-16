// ---------------------------------------------------------------------------
// Liste des animaux perdus autour de l'utilisateur.
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, Platform, ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listLostPetsAPI } from '../../api/lostPets';
import ScreenHeader from '../../components/ScreenHeader';
import colors, { SPACING, RADIUS } from '../../utils/colors';

const SPECIES_FILTERS = [
  { key: null, label: 'Tous' },
  { key: 'chien', label: 'Chien' },
  { key: 'chat', label: 'Chat' },
  { key: 'autre', label: 'Autre' },
];

function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor(diff / (1000 * 60 * 60));
  if (d > 0) return `il y a ${d} j`;
  if (h > 0) return `il y a ${h} h`;
  const m = Math.floor(diff / (1000 * 60));
  return m > 0 ? `il y a ${m} min` : 'a l\'instant';
}

const LostPetCard = ({ lostPet, onPress }) => (
  <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
    {lostPet.photos?.[0] ? (
      <Image source={{ uri: lostPet.photos[0] }} style={s.cardImg} />
    ) : (
      <View style={[s.cardImg, s.cardImgPlaceholder]}>
        <Feather name="camera-off" size={22} color={colors.pebble} />
      </View>
    )}
    <View style={s.cardBody}>
      <View style={s.cardTopRow}>
        <Text style={s.cardName} numberOfLines={1}>{lostPet.name}</Text>
        {lostPet.reward > 0 ? (
          <View style={s.rewardBadge}>
            <Text style={s.rewardText}>{lostPet.reward} EUR</Text>
          </View>
        ) : null}
      </View>
      <Text style={s.cardSpecies}>
        {lostPet.species}{lostPet.breed ? ` • ${lostPet.breed}` : ''}
      </Text>
      {lostPet.lastSeenAddress ? (
        <View style={s.cardRow}>
          <Feather name="map-pin" size={12} color={colors.stone} />
          <Text style={s.cardRowText} numberOfLines={1}>{lostPet.lastSeenAddress}</Text>
        </View>
      ) : null}
      <View style={s.cardRow}>
        <Feather name="clock" size={12} color={colors.stone} />
        <Text style={s.cardRowText}>Perdu {timeAgo(lostPet.lostAt)}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const LostPetsScreen = () => {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const [lostPets, setLostPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [species, setSpecies] = useState(null);
  const [coords, setCoords] = useState(null);

  const fetchLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch (_) {
      return null;
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const c = coords || await fetchLocation();
    if (c && !coords) setCoords(c);
    try {
      const res = await listLostPetsAPI({
        lat: c?.lat, lng: c?.lng, radiusKm: 50,
        species: species || undefined,
      });
      setLostPets(res.data?.lostPets || []);
    } catch (err) {
      console.log('[lostPets] list error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [coords, species, fetchLocation]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Animaux perdus"
        subtitle="Aidez a les retrouver pres de chez vous"
        onBack={() => nav.goBack()}
        variant="light"
      />

      <View style={s.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterContent}>
          {SPECIES_FILTERS.map(f => (
            <TouchableOpacity
              key={f.label}
              style={[s.chip, species === f.key && s.chipActive]}
              onPress={() => setSpecies(f.key)}
            >
              <Text style={[s.chipText, species === f.key && s.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={lostPets}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <LostPetCard lostPet={item} onPress={() => nav.navigate('LostPetDetail', { id: item._id })} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={!loading ? (
          <View style={s.empty}>
            <Feather name="heart" size={40} color={colors.pebble} />
            <Text style={s.emptyTitle}>Aucun animal perdu signale</Text>
            <Text style={s.emptyText}>
              C'est une bonne nouvelle ! Si vous avez perdu votre animal, declarez-le pour alerter la communaute.
            </Text>
          </View>
        ) : null}
        ListFooterComponent={loading ? <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} /> : null}
        contentContainerStyle={{ padding: SPACING.base, paddingBottom: 120 + insets.bottom }}
      />

      <TouchableOpacity
        style={[s.fab, { bottom: Math.max(24, insets.bottom + 16) }]}
        onPress={() => nav.navigate('CreateLostPet')}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={22} color="#fff" />
        <Text style={s.fabText}>Declarer un animal perdu</Text>
      </TouchableOpacity>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  filterBar: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  filterContent: { gap: SPACING.xs, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.borderLight,
    marginRight: SPACING.xs,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.stone, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  cardImg: {
    width: 84, height: 84, borderRadius: 12,
    backgroundColor: colors.linen,
  },
  cardImgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, marginLeft: SPACING.sm, justifyContent: 'center' },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { fontSize: 16, fontWeight: '700', color: colors.charcoal, flex: 1 },
  cardSpecies: { fontSize: 13, color: colors.stone, marginTop: 2, textTransform: 'capitalize' },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  cardRowText: { fontSize: 12, color: colors.stone, flexShrink: 1 },
  rewardBadge: {
    backgroundColor: colors.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
  },
  rewardText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  empty: {
    alignItems: 'center', padding: SPACING.xl,
    marginTop: SPACING['2xl'],
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.charcoal, marginTop: SPACING.sm },
  emptyText: { fontSize: 13, color: colors.stone, textAlign: 'center', marginTop: 6, lineHeight: 19 },

  fab: {
    position: 'absolute',
    left: SPACING.base, right: SPACING.base,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary,
    height: 52, borderRadius: 26,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default LostPetsScreen;
