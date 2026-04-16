// ---------------------------------------------------------------------------
// Detail d'un professionnel : infos + actions (telephone / email / site / maps).
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Linking, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProAPI, trackProContactAPI } from '../../api/professionals';
import ScreenHeader from '../../components/ScreenHeader';
import colors, { SPACING, RADIUS } from '../../utils/colors';

const ProDetailScreen = () => {
  const nav = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const [pro, setPro] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await getProAPI(route.params?.id);
      setPro(res.data?.professional);
    } catch (_) {
    } finally { setLoading(false); }
  }, [route.params?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const contact = async (kind) => {
    if (!pro) return;
    trackProContactAPI(pro._id).catch(() => {});
    if (kind === 'phone' && pro.phone) {
      Linking.openURL(`tel:${pro.phone.replace(/\s+/g, '')}`);
    } else if (kind === 'email' && pro.email) {
      Linking.openURL(`mailto:${pro.email}`);
    } else if (kind === 'website' && pro.website) {
      const url = pro.website.startsWith('http') ? pro.website : `https://${pro.website}`;
      Linking.openURL(url);
    } else if (kind === 'maps') {
      const addr = [pro.address?.street, pro.address?.postalCode, pro.address?.city].filter(Boolean).join(', ');
      if (!addr) return;
      const url = Platform.OS === 'ios'
        ? `maps:0,0?q=${encodeURIComponent(addr)}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
      Linking.openURL(url);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} />;
  if (!pro) return null;

  const addrStr = [pro.address?.street, pro.address?.postalCode, pro.address?.city]
    .filter(Boolean).join(', ');

  return (
    <View style={s.container}>
      <ScreenHeader
        title={pro.name}
        subtitle={pro.type}
        onBack={() => nav.goBack()}
        variant="light"
      />
      <ScrollView contentContainerStyle={{ padding: SPACING.base, paddingBottom: insets.bottom + 40 }}>
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.logoBig}>
            {pro.logo ? <Image source={{ uri: pro.logo }} style={s.logoBigImg} />
              : <Feather name="briefcase" size={30} color={colors.primary} />}
          </View>
          <Text style={s.heroName}>{pro.name}</Text>
          <View style={s.heroRow}>
            {pro.verified ? (
              <View style={s.verifBadge}>
                <Feather name="check-circle" size={12} color={colors.primary} />
                <Text style={s.verifText}>Verifie</Text>
              </View>
            ) : null}
            {pro.emergency ? (
              <View style={s.emerBadge}>
                <Feather name="alert-circle" size={12} color="#fff" />
                <Text style={s.emerText}>Urgences 24/7</Text>
              </View>
            ) : null}
          </View>
          {pro.rating > 0 ? (
            <Text style={s.rating}>
              <Feather name="star" size={12} color={colors.accent} /> {pro.rating.toFixed(1)} ({pro.reviewCount} avis)
            </Text>
          ) : null}
        </View>

        {/* Actions */}
        <View style={s.actions}>
          {pro.phone ? (
            <ActionBtn icon="phone" label="Appeler" onPress={() => contact('phone')} />
          ) : null}
          {pro.email ? (
            <ActionBtn icon="mail" label="Email" onPress={() => contact('email')} />
          ) : null}
          {pro.website ? (
            <ActionBtn icon="globe" label="Site" onPress={() => contact('website')} />
          ) : null}
          {addrStr ? (
            <ActionBtn icon="map-pin" label="Itineraire" onPress={() => contact('maps')} />
          ) : null}
        </View>

        {pro.description ? (
          <View style={s.block}>
            <Text style={s.blockTitle}>A propos</Text>
            <Text style={s.text}>{pro.description}</Text>
          </View>
        ) : null}

        {addrStr ? (
          <View style={s.block}>
            <Text style={s.blockTitle}>Adresse</Text>
            <Text style={s.text}>{addrStr}</Text>
          </View>
        ) : null}

        {pro.services?.length > 0 ? (
          <View style={s.block}>
            <Text style={s.blockTitle}>Services</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {pro.services.map((sv, i) => (
                <View key={i} style={s.tag}><Text style={s.tagText}>{sv}</Text></View>
              ))}
            </View>
          </View>
        ) : null}

        {pro.hours && Object.keys(pro.hours).length > 0 ? (
          <View style={s.block}>
            <Text style={s.blockTitle}>Horaires</Text>
            {Object.entries(pro.hours).map(([day, h]) => (
              <View key={day} style={s.hourRow}>
                <Text style={s.hourDay}>{day}</Text>
                <Text style={s.hourValue}>{h}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {pro.priceRange?.min || pro.priceRange?.max ? (
          <View style={s.block}>
            <Text style={s.blockTitle}>Tarifs indicatifs</Text>
            <Text style={s.text}>
              {pro.priceRange.min ? `a partir de ${pro.priceRange.min} EUR` : ''}
              {pro.priceRange.min && pro.priceRange.max ? ' — ' : ''}
              {pro.priceRange.max ? `jusqu'a ${pro.priceRange.max} EUR` : ''}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

const ActionBtn = ({ icon, label, onPress }) => (
  <TouchableOpacity style={s.actionBtn} onPress={onPress} activeOpacity={0.8}>
    <Feather name={icon} size={18} color={colors.primary} />
    <Text style={s.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  hero: { alignItems: 'center', padding: SPACING.base, backgroundColor: '#fff', borderRadius: RADIUS.md, marginBottom: SPACING.sm },
  logoBig: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  logoBigImg: { width: 72, height: 72, borderRadius: 36 },
  heroName: { fontSize: 20, fontWeight: '800', color: colors.charcoal, textAlign: 'center' },
  heroRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  verifBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  verifText: { color: colors.primaryDark, fontSize: 11, fontWeight: '600' },
  emerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
    backgroundColor: colors.error,
  },
  emerText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  rating: { color: colors.stone, fontSize: 13, marginTop: 6 },

  actions: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    marginBottom: SPACING.sm,
  },
  actionBtn: {
    flex: 1, minWidth: '45%',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 48, borderRadius: 24,
    backgroundColor: colors.primarySoft,
    borderWidth: 1, borderColor: colors.primaryMuted,
  },
  actionLabel: { color: colors.primaryDark, fontWeight: '700' },

  block: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.md, padding: SPACING.base,
    marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  blockTitle: { fontWeight: '700', color: colors.charcoal, marginBottom: 6, fontSize: 14 },
  text: { color: colors.stone, fontSize: 13, lineHeight: 19 },
  tag: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  tagText: { color: colors.primaryDark, fontSize: 11, fontWeight: '600' },
  hourRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  hourDay: { color: colors.stone, fontSize: 12, textTransform: 'capitalize' },
  hourValue: { color: colors.charcoal, fontSize: 12, fontWeight: '600' },
});

export default ProDetailScreen;
