// ---------------------------------------------------------------------------
// Comparateur d'assurance animale. Affiliation — chaque clic est trace et
// redirige vers le site partenaire.
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listInsurancePartnersAPI, trackInsuranceClickAPI } from '../../api/insurance';
import { getMyPetsAPI } from '../../api/pets';
import { useAuth } from '../../context/AuthContext';
import ScreenHeader from '../../components/ScreenHeader';
import { showAlert } from '../../utils/alert';
import colors, { SPACING, RADIUS } from '../../utils/colors';

const openUrl = async (url) => {
  if (!url) return;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank');
    return;
  }
  const ok = await Linking.canOpenURL(url);
  if (ok) Linking.openURL(url);
};

const PartnerCard = ({ partner, onGetQuote }) => (
  <View style={s.card}>
    <View style={s.cardHeader}>
      <View style={s.logoBox}>
        <Feather name="shield" size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={s.name}>{partner.name}</Text>
        <Text style={s.tagline}>{partner.tagline}</Text>
      </View>
    </View>
    <View style={s.priceRow}>
      <Text style={s.priceLabel}>A partir de</Text>
      <Text style={s.price}>{partner.pricingFrom.toFixed(2).replace('.', ',')} EUR</Text>
      <Text style={s.priceLabel}>/ mois</Text>
    </View>
    <View style={s.features}>
      {partner.highlights?.map((h, i) => (
        <View key={i} style={s.featureRow}>
          <Feather name="check" size={13} color={colors.primary} />
          <Text style={s.featureText}>{h}</Text>
        </View>
      ))}
    </View>
    <TouchableOpacity style={s.cta} onPress={() => onGetQuote(partner)}>
      <Text style={s.ctaText}>Obtenir un devis gratuit</Text>
      <Feather name="arrow-right" size={16} color="#fff" />
    </TouchableOpacity>
  </View>
);

const InsuranceScreen = () => {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myPet, setMyPet] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await listInsurancePartnersAPI();
        setPartners(res.data?.partners || []);
      } catch (err) {
        console.log('[insurance] error:', err.message);
      } finally { setLoading(false); }

      if (user) {
        try {
          const petsRes = await getMyPetsAPI();
          const pets = petsRes.data?.pets || petsRes.data || [];
          if (pets[0]) setMyPet(pets[0]);
        } catch (_) {}
      }
    })();
  }, [user]);

  const handleGetQuote = async (partner) => {
    try {
      const res = await trackInsuranceClickAPI({
        partner: partner.id,
        animalSpecies: myPet?.species,
        animalAge: typeof myPet?.age === 'number' ? myPet.age : null,
        source: 'app',
      });
      const url = res.data?.url;
      if (url) await openUrl(url);
    } catch (err) {
      showAlert('Erreur', 'Impossible d\'ouvrir le devis partenaire.');
    }
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Assurance animale"
        subtitle="Comparez et economisez jusqu'a 300 EUR/an"
        onBack={() => nav.goBack()}
        variant="light"
      />
      <ScrollView contentContainerStyle={{ padding: SPACING.base, paddingBottom: insets.bottom + 40 }}>
        {/* Hook */}
        <View style={s.hookCard}>
          <Feather name="info" size={18} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={s.hookText}>
            7% des animaux seulement sont assures en France. Une hospitalisation peut depasser 2000 EUR.
            Voici les meilleures offres du moment — devis gratuit et sans engagement.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
        ) : (
          partners.map(p => (
            <PartnerCard key={p.id} partner={p} onGetQuote={handleGetQuote} />
          ))
        )}

        <Text style={s.legal}>
          Pepete percoit une commission d'affiliation sur les souscriptions. Cela n'impacte pas
          le prix de votre contrat et nous aide a rester gratuit pour vous.
        </Text>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },

  hookCard: {
    flexDirection: 'row',
    backgroundColor: colors.primarySoft,
    borderRadius: RADIUS.md, padding: SPACING.base,
    marginBottom: SPACING.base,
    borderWidth: 1, borderColor: colors.primaryMuted,
  },
  hookText: { flex: 1, color: colors.primaryDark, fontSize: 13, lineHeight: 19 },

  card: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  logoBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.charcoal },
  tagline: { fontSize: 12, color: colors.stone, marginTop: 2 },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: SPACING.sm },
  priceLabel: { color: colors.stone, fontSize: 12 },
  price: { color: colors.primaryDark, fontSize: 24, fontWeight: '800' },

  features: { marginBottom: SPACING.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3 },
  featureText: { color: colors.charcoal, fontSize: 13 },

  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary,
    height: 46, borderRadius: 23,
  },
  ctaText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  legal: {
    fontSize: 11, color: colors.pebble,
    marginTop: SPACING.base, lineHeight: 16, textAlign: 'center',
  },
});

export default InsuranceScreen;
