// ─────────────────────────────────────────────────────────────────────────────
// Pepete — PublicScoreScreen
// Shareable product score page — viral on TikTok/Insta
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, Share,
  ActivityIndicator, ScrollView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, RADIUS, SPACING, FONT_SIZE, getScoreColor, getScoreLabel } from '../../utils/colors';
import { FONTS } from '../../utils/typography';
import { getPublicProductAPI } from '../../api/products';
import { hapticLight, hapticSuccess } from '../../utils/haptics';

const PublicScoreScreen = ({ route, navigation }) => {
  const { barcode } = route.params || {};
  const insets = useSafeAreaInsets();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!barcode) {
      setError('Code-barres manquant');
      setLoading(false);
      return;
    }
    getPublicProductAPI(barcode)
      .then(res => {
        setProduct(res.data?.product || null);
        if (!res.data?.product) setError('Produit non trouve');
      })
      .catch(() => setError('Impossible de charger le produit'))
      .finally(() => setLoading(false));
  }, [barcode]);

  const handleShare = async () => {
    hapticLight();
    if (!product) return;
    const score = product.nutritionScore ?? 0;
    const emoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : score >= 40 ? '🟠' : '🔴';
    const brandText = product.brand ? ` de ${product.brand}` : '';
    const dangerous = product.dangerousIngredients || [];
    const warn = dangerous.length > 0
      ? `\n⚠️ ${dangerous.length} ingrédient${dangerous.length > 1 ? 's' : ''} a risque !`
      : '';
    const msg = `${emoji} ${product.name}${brandText} → ${score}/100 sur Pepete !${warn}\n\n🐾 Scanne les croquettes de ton animal ➡️ pepete.fr/scan/${barcode}`;
    try {
      await Share.share({ message: msg });
    } catch (_) {}
  };

  const handleScanCTA = () => {
    hapticSuccess();
    navigation.navigate('ScannerMain');
  };

  if (loading) {
    return (
      <View style={[s.center, { paddingTop: insets.top + 60 }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={s.loadingText}>Chargement du produit...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[s.center, { paddingTop: insets.top + 60 }]}>
        <Feather name="alert-circle" size={48} color={COLORS.textLight} />
        <Text style={s.errorText}>{error || 'Produit non trouve'}</Text>
        <TouchableOpacity style={s.ctaBtn} onPress={() => navigation.goBack()}>
          <Text style={s.ctaBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const score = product.nutritionScore ?? 0;
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const dangerous = product.dangerousIngredients || [];
  const animals = (product.targetAnimal || []).join(', ');

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView bounces={true} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Hero gradient */}
        <LinearGradient
          colors={score >= 60 ? ['#1C2B1E', '#2C3E2F'] : ['#2B1C1E', '#3E2C2F']}
          style={s.hero}
        >
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>

          <View style={s.heroContent}>
            <Text style={s.heroLabel}>SCORE PEPETE</Text>
            <View style={[s.scoreCircle, { borderColor: color }]}>
              <Text style={[s.scoreNumber, { color }]}>{score}</Text>
              <Text style={s.scoreMax}>/100</Text>
            </View>
            <View style={[s.verdictBadge, { backgroundColor: color + '20' }]}>
              <Text style={[s.verdictText, { color }]}>{label}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Product info card */}
        <View style={s.cardArea}>
          <View style={s.card}>
            <Text style={s.productName}>{product.name}</Text>
            {product.brand ? <Text style={s.productBrand}>{product.brand}</Text> : null}
            {animals ? (
              <View style={s.animalRow}>
                <Feather name="heart" size={14} color={COLORS.primary} />
                <Text style={s.animalText}>{animals}</Text>
              </View>
            ) : null}

            {/* Dangerous ingredients warning */}
            {dangerous.length > 0 && (
              <View style={s.dangerSection}>
                <View style={s.dangerHeader}>
                  <Feather name="alert-triangle" size={16} color={COLORS.scoreVeryBad} />
                  <Text style={s.dangerTitle}>
                    {dangerous.length} ingredient{dangerous.length > 1 ? 's' : ''} a risque
                  </Text>
                </View>
                {dangerous.map((ing, i) => (
                  <View key={i} style={s.dangerItem}>
                    <View style={s.dangerDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.dangerName}>{ing.name}</Text>
                      {ing.description ? <Text style={s.dangerDesc}>{ing.description}</Text> : null}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Scan count social proof */}
            {product.scanCount > 0 && (
              <View style={s.socialRow}>
                <Feather name="users" size={14} color={COLORS.textLight} />
                <Text style={s.socialText}>
                  Scanne {product.scanCount} fois par la communaute Pepete
                </Text>
              </View>
            )}

            {/* Share button */}
            <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.85}>
              <Feather name="share-2" size={18} color="#FFF" />
              <Text style={s.shareBtnText}>Partager ce résultat</Text>
            </TouchableOpacity>

            {/* CTA */}
            <TouchableOpacity style={s.scanBtn} onPress={handleScanCTA} activeOpacity={0.85}>
              <LinearGradient
                colors={[COLORS.primaryDark || '#527A56', COLORS.primary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.scanBtnGradient}
              >
                <Feather name="camera" size={20} color="#FFF" />
                <Text style={s.scanBtnText}>Scanne les croquettes de ton animal</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={s.freeLabel}>100% gratuit · Aucun compte requis</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1C2B1E' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background, padding: SPACING.xl },
  loadingText: { fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: SPACING.lg },
  errorText: { fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZE.base, color: COLORS.textSecondary, marginTop: SPACING.lg, textAlign: 'center' },

  hero: { paddingTop: 16, paddingBottom: SPACING['2xl'] + 20, paddingHorizontal: SPACING.xl, alignItems: 'center' },
  backBtn: {
    alignSelf: 'flex-start', width: 40, height: 40, borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl,
  },
  heroContent: { alignItems: 'center' },
  heroLabel: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZE.xs, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: SPACING.lg },
  scoreCircle: {
    width: 140, height: 140, borderRadius: 70, borderWidth: 6,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: SPACING.lg,
  },
  scoreNumber: { fontFamily: FONTS.heading, fontSize: 48, letterSpacing: -2 },
  scoreMax: { fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.4)' },
  verdictBadge: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full },
  verdictText: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZE.sm },

  cardArea: { backgroundColor: COLORS.background, paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS['2xl'], padding: SPACING.xl, ...SHADOWS.lg },
  productName: { fontFamily: FONTS.heading, fontSize: FONT_SIZE.xl, color: COLORS.text, marginBottom: 4 },
  productBrand: { fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.md },
  animalRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg },
  animalText: { fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZE.sm, color: COLORS.primary },

  dangerSection: { backgroundColor: '#FFF5F5', borderRadius: RADIUS.xl, padding: SPACING.base, marginBottom: SPACING.lg },
  dangerHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  dangerTitle: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZE.sm, color: COLORS.scoreVeryBad },
  dangerItem: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.sm },
  dangerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.scoreVeryBad, marginTop: 6 },
  dangerName: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZE.sm, color: COLORS.text },
  dangerDesc: { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },

  socialRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg },
  socialText: { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.textLight },

  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.text, paddingVertical: SPACING.base, borderRadius: RADIUS.xl, marginBottom: SPACING.md,
  },
  shareBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZE.sm, color: '#FFF' },

  scanBtn: { borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: SPACING.md },
  scanBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.base + 4, borderRadius: RADIUS.xl,
  },
  scanBtnText: { fontFamily: FONTS.heading, fontSize: FONT_SIZE.sm, color: '#FFF' },
  freeLabel: { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.textLight, textAlign: 'center' },

  ctaBtn: { marginTop: SPACING.lg, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.base, backgroundColor: COLORS.primary, borderRadius: RADIUS.xl },
  ctaBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZE.sm, color: '#FFF' },
});

export default PublicScoreScreen;
