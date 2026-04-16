// ---------------------------------------------------------------------------
// Pepete Plus — Paywall
// Plans Mensuel / Annuel, paiement 1 clic via Stripe Checkout hosted page.
// ---------------------------------------------------------------------------

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import {
  createCheckoutSessionAPI,
  createPortalSessionAPI,
  getPaymentStatusAPI,
} from '../../api/payments';
import { showAlert } from '../../utils/alert';
import colors, { SPACING, RADIUS } from '../../utils/colors';

const BENEFITS = [
  { icon: 'message-circle', title: 'IA illimitee',       text: 'Posez autant de questions que vous voulez a l\'assistant veterinaire.' },
  { icon: 'camera',         title: 'Scans illimites',    text: 'Analysez tous vos produits sans restriction quotidienne.' },
  { icon: 'alert-triangle', title: 'Alertes rappels',    text: 'Recevez immediatement les rappels produits concernant vos animaux.' },
  { icon: 'activity',       title: 'Analyse detaillee',  text: 'Rapport complet ingredients + alternatives recommandees.' },
  { icon: 'download',       title: 'Export veterinaire', text: 'PDF historique alimentation a presenter chez le veto.' },
  { icon: 'heart',          title: 'Soutien l\'app',     text: 'Pepete reste independant, zero publicite.' },
];

const DEFAULT_PLANS = [
  { id: 'monthly', name: 'Mensuel', price: 2.99,  period: 'mois', badge: null },
  { id: 'yearly',  name: 'Annuel',  price: 19.99, period: 'an',   badge: 'ECONOMISEZ 44%' },
];

const openUrl = async (url) => {
  if (!url) return;
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = url;
      return;
    }
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  } catch (err) {
    console.log('[paywall] openUrl error:', err.message);
    showAlert('Erreur', "Impossible d'ouvrir la page de paiement.");
  }
};

const BenefitRow = ({ icon, title, text }) => (
  <View style={s.benefit}>
    <View style={s.benefitIcon}>
      <Feather name={icon} size={18} color={colors.primary} />
    </View>
    <View style={s.benefitText}>
      <Text style={s.benefitTitle}>{title}</Text>
      <Text style={s.benefitSub}>{text}</Text>
    </View>
  </View>
);

const PlanCard = ({ plan, selected, onSelect }) => {
  const isYearly = plan.id === 'yearly';
  const monthlyEquivalent = isYearly ? (plan.price / 12).toFixed(2) : null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onSelect(plan.id)}
      style={[s.planCard, selected && s.planCardSelected]}
    >
      {plan.badge ? (
        <View style={s.planBadge}>
          <Text style={s.planBadgeText}>{plan.badge}</Text>
        </View>
      ) : null}
      <View style={s.planTop}>
        <View style={s.radio}>
          {selected ? <View style={s.radioDot} /> : null}
        </View>
        <Text style={s.planName}>{plan.name}</Text>
      </View>
      <View style={s.priceRow}>
        <Text style={s.priceAmount}>{plan.price.toFixed(2).replace('.', ',')} EUR</Text>
        <Text style={s.pricePeriod}>/ {plan.period}</Text>
      </View>
      {monthlyEquivalent ? (
        <Text style={s.priceHint}>soit {monthlyEquivalent.replace('.', ',')} EUR / mois</Text>
      ) : (
        <Text style={s.priceHint}>Annulable a tout moment</Text>
      )}
    </TouchableOpacity>
  );
};

const PaywallScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();

  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const reasonText = route.params?.reason;

  const loadStatus = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getPaymentStatusAPI();
      const data = res.data || {};
      if (Array.isArray(data.plans) && data.plans.length > 0) {
        setPlans(data.plans.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          period: p.period,
          badge: p.discount ? `ECONOMISEZ ${p.discount.replace('-', '')}` : null,
        })));
      }
      setStatus(data.subscription || null);
    } catch (err) {
      console.log('[paywall] status error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refresh on focus — handles the return from Stripe Checkout
  useFocusEffect(useCallback(() => {
    loadStatus();
    if (refreshUser) refreshUser();
  }, [loadStatus, refreshUser]));

  const handleSubscribe = useCallback(async () => {
    if (!user) {
      navigation.navigate('AuthStack', { screen: 'Register' });
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await createCheckoutSessionAPI(selectedPlan);
      const url = res.data?.url;
      if (!url) {
        showAlert('Erreur', 'Impossible de demarrer le paiement. Reessayez.');
        return;
      }
      await openUrl(url);
    } catch (err) {
      const msg = err.response?.data?.error || err.userMessage || 'Paiement indisponible pour le moment.';
      showAlert('Erreur', msg);
    } finally {
      setCheckoutLoading(false);
    }
  }, [selectedPlan, user, navigation]);

  const handleManage = useCallback(async () => {
    setCheckoutLoading(true);
    try {
      const res = await createPortalSessionAPI();
      const url = res.data?.url;
      if (url) await openUrl(url);
    } catch (err) {
      const msg = err.response?.data?.error || 'Portail indisponible.';
      showAlert('Erreur', msg);
    } finally {
      setCheckoutLoading(false);
    }
  }, []);

  const isPremium = status?.isPremium || user?.isPremium;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#1A2E1D', '#2C3E2F', '#527A56']}
        style={[s.hero, { paddingTop: insets.top + SPACING.base }]}
      >
        <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
          <Feather name="x" size={22} color="#F5F0E8" />
        </TouchableOpacity>

        <View style={s.crown}>
          <Feather name="star" size={28} color="#F5F0E8" />
        </View>
        <Text style={s.title}>Pepete Plus</Text>
        <Text style={s.subtitle}>Le meilleur pour vos animaux, sans limite.</Text>

        {reasonText ? (
          <View style={s.reasonCard}>
            <Feather name="lock" size={14} color="#F5F0E8" style={{ marginRight: 8 }} />
            <Text style={s.reasonText}>{reasonText}</Text>
          </View>
        ) : null}
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 160 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Benefits */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Tout ce qui est inclus</Text>
          {BENEFITS.map((b) => <BenefitRow key={b.title} {...b} />)}
        </View>

        {/* Plans or Premium status */}
        {isPremium ? (
          <View style={s.premiumBox}>
            <Feather name="check-circle" size={24} color={colors.primary} />
            <Text style={s.premiumTitle}>Vous etes Pepete Plus</Text>
            {status?.premiumUntil ? (
              <Text style={s.premiumSub}>
                Actif jusqu'au {new Date(status.premiumUntil).toLocaleDateString('fr-FR')}
              </Text>
            ) : null}
            <TouchableOpacity style={s.manageBtn} onPress={handleManage} disabled={checkoutLoading}>
              {checkoutLoading
                ? <ActivityIndicator color={colors.primary} />
                : <Text style={s.manageBtnText}>Gerer mon abonnement</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Choisissez votre formule</Text>
            {plans.map((p) => (
              <PlanCard
                key={p.id}
                plan={p}
                selected={selectedPlan === p.id}
                onSelect={setSelectedPlan}
              />
            ))}
            <Text style={s.legal}>
              Paiement securise via Stripe. Sans engagement, annulable a tout moment depuis votre compte.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky CTA */}
      {!isPremium ? (
        <View style={[s.stickyBar, { paddingBottom: Math.max(SPACING.base, insets.bottom) }]}>
          <TouchableOpacity
            style={[s.cta, checkoutLoading && s.ctaDisabled]}
            onPress={handleSubscribe}
            activeOpacity={0.85}
            disabled={checkoutLoading || loading}
          >
            {checkoutLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="zap" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={s.ctaText}>
                  Passer a Pepete Plus
                </Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={s.ctaSub}>
            {selectedPlan === 'yearly' ? 'Facture une fois par an — 19,99 EUR' : 'Facture mensuellement — 2,99 EUR'}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },

  hero: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING['2xl'],
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 16,
    right: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(245,240,232,0.12)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  crown: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(245,240,232,0.15)',
    borderWidth: 1, borderColor: 'rgba(245,240,232,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.base,
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 36, color: '#F5F0E8', letterSpacing: -1, marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(245,240,232,0.7)',
    fontSize: 14, textAlign: 'center',
  },
  reasonCard: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: SPACING.lg,
    backgroundColor: 'rgba(245,240,232,0.12)',
    borderWidth: 1, borderColor: 'rgba(245,240,232,0.2)',
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 999,
  },
  reasonText: {
    color: '#F5F0E8', fontSize: 13, flexShrink: 1,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.lg },
  section: { marginBottom: SPACING.xl },
  sectionTitle: {
    fontSize: 18, fontWeight: '700',
    color: colors.charcoal, marginBottom: SPACING.base,
  },

  // Benefits
  benefit: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  benefitIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
  },
  benefitText: { flex: 1 },
  benefitTitle: {
    fontSize: 15, fontWeight: '700',
    color: colors.charcoal, marginBottom: 2,
  },
  benefitSub: {
    fontSize: 13, color: colors.stone, lineHeight: 18,
  },

  // Plans
  planCard: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
    borderWidth: 2, borderColor: colors.borderLight,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  planBadge: {
    position: 'absolute',
    top: -10, right: SPACING.base,
    backgroundColor: colors.accent,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12,
  },
  planBadgeText: {
    color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5,
  },
  planTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  radioDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary,
  },
  planName: {
    fontSize: 16, fontWeight: '700', color: colors.charcoal,
  },
  priceRow: {
    flexDirection: 'row', alignItems: 'baseline',
    marginLeft: 28, marginTop: 2,
  },
  priceAmount: {
    fontSize: 26, fontWeight: '800', color: colors.primaryDark,
  },
  pricePeriod: {
    fontSize: 14, color: colors.stone, marginLeft: 4,
  },
  priceHint: {
    marginLeft: 28, marginTop: 2, fontSize: 12, color: colors.pebble,
  },

  legal: {
    fontSize: 11, color: colors.pebble,
    textAlign: 'center', marginTop: SPACING.sm, lineHeight: 16,
  },

  // Premium box (already subscribed)
  premiumBox: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 2, borderColor: colors.primarySoft,
  },
  premiumTitle: {
    fontSize: 18, fontWeight: '700',
    color: colors.primaryDark,
    marginTop: SPACING.sm,
  },
  premiumSub: {
    fontSize: 13, color: colors.stone, marginTop: 4,
  },
  manageBtn: {
    marginTop: SPACING.base,
    paddingHorizontal: SPACING.lg, paddingVertical: 10,
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
  },
  manageBtnText: {
    color: colors.primaryDark, fontWeight: '600',
  },

  // Sticky CTA
  stickyBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.98)',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  cta: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: RADIUS.xl,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: {
    color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2,
  },
  ctaSub: {
    textAlign: 'center', marginTop: 8,
    fontSize: 12, color: colors.pebble,
  },
});

export default PaywallScreen;
