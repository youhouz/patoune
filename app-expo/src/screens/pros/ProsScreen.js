// ---------------------------------------------------------------------------
// Annuaire des professionnels : vetos, toiletteurs, educateurs, etc.
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, ScrollView, TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchProsAPI } from '../../api/professionals';
import ScreenHeader from '../../components/ScreenHeader';
import colors, { SPACING, RADIUS } from '../../utils/colors';

const TYPES = [
  { key: null,                label: 'Tous',          icon: 'grid' },
  { key: 'veterinaire',       label: 'Veterinaires',  icon: 'activity' },
  { key: 'toiletteur',        label: 'Toiletteurs',   icon: 'scissors' },
  { key: 'educateur',         label: 'Educateurs',    icon: 'award' },
  { key: 'comportementaliste',label: 'Comport.',      icon: 'smile' },
  { key: 'pension',           label: 'Pensions',      icon: 'home' },
  { key: 'petshop',           label: 'Pet shops',     icon: 'shopping-bag' },
];

const ProCard = ({ pro, onPress }) => (
  <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
    <View style={s.logoBox}>
      {pro.logo ? (
        <Image source={{ uri: pro.logo }} style={s.logoImg} />
      ) : (
        <Feather name="briefcase" size={22} color={colors.primary} />
      )}
    </View>
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={s.name} numberOfLines={1}>{pro.name}</Text>
        {pro.isFeatured ? (
          <View style={s.featured}><Text style={s.featuredText}>SPONSO</Text></View>
        ) : null}
        {pro.verified ? (
          <Feather name="check-circle" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
        ) : null}
      </View>
      <Text style={s.type}>{pro.type}</Text>
      {pro.address?.city ? (
        <View style={s.row}>
          <Feather name="map-pin" size={11} color={colors.stone} />
          <Text style={s.rowText}>{pro.address.city}{pro.address.postalCode ? ` • ${pro.address.postalCode}` : ''}</Text>
        </View>
      ) : null}
      {pro.rating > 0 ? (
        <View style={s.row}>
          <Feather name="star" size={11} color={colors.accent} />
          <Text style={s.rowText}>{pro.rating.toFixed(1)} ({pro.reviewCount || 0} avis)</Text>
        </View>
      ) : null}
      {pro.emergency ? (
        <View style={s.emergency}>
          <Feather name="alert-circle" size={11} color="#fff" />
          <Text style={s.emergencyText}>Urgences 24/7</Text>
        </View>
      ) : null}
    </View>
  </TouchableOpacity>
);

const ProsScreen = () => {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState(null);
  const [query, setQuery] = useState('');
  const [pros, setPros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState(null);

  const fetchLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const pos = await Location.getCurrentPositionAsync({});
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch (_) { return null; }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const c = coords || await fetchLocation();
    if (c && !coords) setCoords(c);
    try {
      const res = await searchProsAPI({
        type: type || undefined, q: query || undefined,
        lat: c?.lat, lng: c?.lng, radiusKm: 20,
      });
      setPros(res.data?.professionals || []);
    } catch (err) {
      console.log('[pros] error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [type, query, coords, fetchLocation]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Pros animaux"
        subtitle="Veto, toiletteur, educateur... pres de vous"
        onBack={() => nav.goBack()}
        variant="light"
      />

      <View style={s.searchWrap}>
        <Feather name="search" size={16} color={colors.stone} />
        <TextInput
          style={s.search}
          placeholder="Rechercher un pro ou une clinique..."
          placeholderTextColor={colors.pebble}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={load}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
        {TYPES.map(t => (
          <TouchableOpacity
            key={t.label}
            style={[s.chip, type === t.key && s.chipActive]}
            onPress={() => setType(t.key)}
          >
            <Feather name={t.icon} size={13} color={type === t.key ? '#fff' : colors.stone} />
            <Text style={[s.chipText, type === t.key && { color: '#fff' }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={pros}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ProCard pro={item} onPress={() => nav.navigate('ProDetail', { id: item._id })} />
        )}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.primary} />}
        ListEmptyComponent={!loading ? (
          <View style={s.empty}>
            <Feather name="search" size={40} color={colors.pebble} />
            <Text style={s.emptyTitle}>Aucun pro trouve</Text>
            <Text style={s.emptyText}>Essayez un autre filtre ou agrandissez le rayon de recherche.</Text>
          </View>
        ) : null}
        ListFooterComponent={loading ? <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} /> : null}
        contentContainerStyle={{ padding: SPACING.base, paddingBottom: insets.bottom + 40 }}
      />
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: SPACING.base, marginTop: SPACING.sm, marginBottom: SPACING.xs,
    paddingHorizontal: 14,
    backgroundColor: colors.white, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: colors.borderLight,
    height: 44,
  },
  search: { flex: 1, color: colors.charcoal, fontSize: 14, paddingVertical: 0 },

  filters: { paddingHorizontal: SPACING.base, paddingVertical: SPACING.xs, gap: 6 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.borderLight,
    marginRight: 6,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.stone, fontSize: 12, fontWeight: '600' },

  card: {
    flexDirection: 'row', gap: SPACING.sm,
    backgroundColor: colors.white, borderRadius: RADIUS.md,
    padding: SPACING.sm, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  logoBox: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  logoImg: { width: 52, height: 52, borderRadius: 12 },
  name: { fontSize: 15, fontWeight: '700', color: colors.charcoal, flex: 1 },
  type: { fontSize: 12, color: colors.stone, textTransform: 'capitalize', marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rowText: { fontSize: 12, color: colors.stone },
  featured: {
    backgroundColor: colors.accent, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, marginLeft: 6,
  },
  featuredText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  emergency: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.error, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, marginTop: 6,
  },
  emergencyText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  empty: { alignItems: 'center', padding: SPACING.xl, marginTop: SPACING['2xl'] },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.charcoal, marginTop: SPACING.sm },
  emptyText: { fontSize: 13, color: colors.stone, textAlign: 'center', marginTop: 6, lineHeight: 19 },
});

export default ProsScreen;
