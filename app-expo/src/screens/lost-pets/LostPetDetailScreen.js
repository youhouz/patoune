// ---------------------------------------------------------------------------
// Detail d'un animal perdu + partage + bouton "Je l'ai vu".
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  Linking, ActivityIndicator, Platform, Share,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getLostPetAPI, setLostPetStatusAPI, addSightingAPI } from '../../api/lostPets';
import { useAuth } from '../../context/AuthContext';
import { showAlert } from '../../utils/alert';
import { API_URL } from '../../api/client';
import ScreenHeader from '../../components/ScreenHeader';
import colors, { SPACING, RADIUS } from '../../utils/colors';

const LostPetDetailScreen = () => {
  const nav = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [lostPet, setLostPet] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await getLostPetAPI(route.params?.id);
      setLostPet(res.data?.lostPet);
    } catch (err) {
      showAlert('Erreur', 'Signalement introuvable');
    } finally {
      setLoading(false);
    }
  }, [route.params?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const isOwner = user && lostPet && user.id === lostPet.owner;

  const share = async () => {
    if (!lostPet) return;
    const base = API_URL.replace(/\/api$/, '');
    const url = `${base}/lost/${lostPet.shareToken}`;
    const message = `ALERTE — ${lostPet.name} (${lostPet.species}${lostPet.breed ? ' ' + lostPet.breed : ''}) a disparu ${lostPet.lastSeenAddress ? 'a ' + lostPet.lastSeenAddress : ''}. Aidez a le retrouver : ${url}`;
    try {
      if (Platform.OS === 'web' && navigator.share) {
        await navigator.share({ title: `Alerte : ${lostPet.name}`, text: message, url });
      } else {
        await Share.share({ message, url });
      }
    } catch (_) {}
  };

  const callContact = async () => {
    if (!lostPet?.contactPhone) return;
    const tel = `tel:${lostPet.contactPhone.replace(/\s+/g, '')}`;
    const ok = await Linking.canOpenURL(tel);
    if (ok) Linking.openURL(tel);
  };

  const markFound = async () => {
    await setLostPetStatusAPI(lostPet._id, 'found');
    showAlert('Bonne nouvelle !', 'L\'alerte est cloturee. Merci a la communaute.');
    load();
  };

  const reportSighting = () => {
    if (!user) {
      showAlert('Compte requis', 'Connectez-vous pour signaler une observation.');
      return;
    }
    // Minimal: envoie uniquement la position actuelle
    (async () => {
      try {
        const Location = require('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          showAlert('Permission refusee', 'La geolocalisation est necessaire.');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({});
        await addSightingAPI(lostPet._id, {
          lat: pos.coords.latitude, lng: pos.coords.longitude,
          reporterName: user.name, reporterPhone: user.phone || '',
          notes: 'Signale depuis l\'app',
        });
        showAlert('Merci !', 'Le proprietaire a ete notifie de votre observation.');
        load();
      } catch (err) {
        showAlert('Erreur', 'Impossible d\'envoyer votre observation.');
      }
    })();
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} />;
  if (!lostPet) return null;

  return (
    <View style={s.container}>
      <ScreenHeader
        title={lostPet.name}
        subtitle={lostPet.status === 'active' ? 'Animal perdu' : lostPet.status === 'found' ? 'Retrouve !' : 'Annule'}
        onBack={() => nav.goBack()}
        variant="light"
      />
      <ScrollView contentContainerStyle={{ padding: SPACING.base, paddingBottom: insets.bottom + 140 }}>
        {/* Photos */}
        {lostPet.photos?.[0] ? (
          <Image source={{ uri: lostPet.photos[0] }} style={s.heroImg} />
        ) : (
          <View style={[s.heroImg, s.heroPlaceholder]}>
            <Feather name="camera-off" size={36} color={colors.pebble} />
          </View>
        )}

        {/* Status pill */}
        <View style={[s.statusPill,
          lostPet.status === 'active' ? s.statusActive :
          lostPet.status === 'found' ? s.statusFound : s.statusCancelled,
        ]}>
          <Text style={s.statusText}>
            {lostPet.status === 'active' ? 'Recherche active' : lostPet.status === 'found' ? 'Retrouve' : 'Signalement annule'}
          </Text>
        </View>

        {/* Infos */}
        <View style={s.block}>
          <Row label="Espece" value={`${lostPet.species}${lostPet.breed ? ' • ' + lostPet.breed : ''}`} />
          {lostPet.color ? <Row label="Couleur" value={lostPet.color} /> : null}
          {lostPet.microchip ? <Row label="Puce" value={lostPet.microchip} /> : null}
          {lostPet.lastSeenAddress ? <Row label="Dernier lieu" value={lostPet.lastSeenAddress} /> : null}
          <Row label="Perdu le" value={new Date(lostPet.lostAt).toLocaleDateString('fr-FR')} />
          {lostPet.reward > 0 ? <Row label="Recompense" value={`${lostPet.reward} EUR`} /> : null}
        </View>

        {lostPet.distinctiveSigns ? (
          <View style={s.block}>
            <Text style={s.blockTitle}>Signes distinctifs</Text>
            <Text style={s.text}>{lostPet.distinctiveSigns}</Text>
          </View>
        ) : null}

        {lostPet.circumstances ? (
          <View style={s.block}>
            <Text style={s.blockTitle}>Circonstances</Text>
            <Text style={s.text}>{lostPet.circumstances}</Text>
          </View>
        ) : null}

        {lostPet.sightings?.length > 0 ? (
          <View style={s.block}>
            <Text style={s.blockTitle}>Observations ({lostPet.sightings.length})</Text>
            {lostPet.sightings.slice(-5).reverse().map((sg, idx) => (
              <View key={idx} style={s.sighting}>
                <Feather name="eye" size={14} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={s.sightingText}>{sg.notes || 'Animal apercu'}</Text>
                  <Text style={s.sightingMeta}>
                    {new Date(sg.seenAt).toLocaleString('fr-FR')}
                    {sg.address ? ` • ${sg.address}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Actions */}
        {lostPet.status === 'active' ? (
          <View style={{ gap: SPACING.sm, marginTop: SPACING.sm }}>
            {!isOwner ? (
              <TouchableOpacity style={s.primary} onPress={callContact}>
                <Feather name="phone" size={18} color="#fff" />
                <Text style={s.primaryText}>Appeler le proprietaire</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={s.secondary} onPress={share}>
              <Feather name="share-2" size={18} color={colors.primary} />
              <Text style={s.secondaryText}>Partager l'alerte</Text>
            </TouchableOpacity>

            {!isOwner ? (
              <TouchableOpacity style={s.outline} onPress={reportSighting}>
                <Feather name="eye" size={18} color={colors.primary} />
                <Text style={s.outlineText}>Je l'ai vu</Text>
              </TouchableOpacity>
            ) : null}

            {isOwner ? (
              <TouchableOpacity
                style={s.found}
                onPress={() => showAlert('Confirmer', 'Marquer l\'animal comme retrouve ?', [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Oui', onPress: markFound },
                ])}
              >
                <Feather name="check-circle" size={18} color="#fff" />
                <Text style={s.primaryText}>Je l'ai retrouve</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

const Row = ({ label, value }) => (
  <View style={s.row}>
    <Text style={s.rowLabel}>{label}</Text>
    <Text style={s.rowValue}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  heroImg: {
    width: '100%', aspectRatio: 1.2,
    borderRadius: RADIUS.md, backgroundColor: colors.linen,
    marginBottom: SPACING.base,
  },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },

  statusPill: {
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, marginBottom: SPACING.base,
  },
  statusActive: { backgroundColor: colors.accentSoft },
  statusFound: { backgroundColor: colors.primarySoft },
  statusCancelled: { backgroundColor: colors.linen },
  statusText: { fontSize: 12, fontWeight: '700', color: colors.charcoal },

  block: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.md, padding: SPACING.base,
    marginBottom: SPACING.base,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  blockTitle: { fontWeight: '700', color: colors.charcoal, marginBottom: 8, fontSize: 15 },
  text: { color: colors.stone, fontSize: 14, lineHeight: 20 },

  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel: { color: colors.stone, fontSize: 13 },
  rowValue: { color: colors.charcoal, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },

  sighting: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  sightingText: { color: colors.charcoal, fontSize: 13 },
  sightingMeta: { color: colors.pebble, fontSize: 11, marginTop: 2 },

  primary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary,
    height: 52, borderRadius: 26,
  },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primarySoft,
    height: 52, borderRadius: 26,
  },
  secondaryText: { color: colors.primaryDark, fontSize: 15, fontWeight: '700' },
  outline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 2, borderColor: colors.primary,
    height: 52, borderRadius: 26,
  },
  outlineText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  found: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primaryDark,
    height: 52, borderRadius: 26,
  },
});

export default LostPetDetailScreen;
