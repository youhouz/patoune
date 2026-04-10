// ─────────────────────────────────────────────────────────────────────────────
// Pepete — ExtremeScoreSharePrompt
// Shows a contextual share prompt for very high or very low scores.
// Extreme scores are the most viral — people LOVE sharing shocking results.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Share,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, SHADOWS } from '../utils/colors';
import { FONTS } from '../utils/typography';
import { hapticLight } from '../utils/haptics';

const ExtremeScoreSharePrompt = ({ product, score, visible, onDismiss }) => {
  const slideAnim = useRef(new Animated.Value(120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(120);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible || !product) return null;

  const isGreat = score >= 85;
  const emoji = isGreat ? '🎉' : '😱';
  const title = isGreat
    ? 'Excellent choix !'
    : 'Attention danger !';
  const subtitle = isGreat
    ? 'Ce produit est top. Tes potes qui ont un animal doivent connaitre !'
    : 'Ce produit est dangereux. Previens tes potes qui utilisent cette marque !';
  const btnColor = isGreat ? COLORS.scoreExcellent : COLORS.scoreVeryBad;
  const btnText = isGreat ? 'Recommander a mes potes' : 'Alerter mes potes';

  const handleShare = async () => {
    hapticLight();
    const brandText = product.brand ? ` de ${product.brand}` : '';
    const link = product.barcode ? `pepete.fr/scan/${product.barcode}` : 'pepete.fr';
    const message = isGreat
      ? `🟢 ${product.name}${brandText} → ${score}/100 !\n\n✅ Excellent produit pour mon animal. Je recommande !\n\n🐾 Scanne les croquettes de ton animal ➡️ ${link}`
      : `🔴 ${product.name}${brandText} → ${score}/100 !\n\n⚠️ Ce produit est dangereux pour nos animaux. Checkez vos croquettes !\n\n🐾 Scanne gratuitement ➡️ ${link}`;
    try {
      await Share.share({ message });
    } catch (_) {}
    onDismiss();
  };

  return (
    <Animated.View
      style={[
        s.container,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <View style={s.card}>
        <View style={s.row}>
          <Text style={s.emoji}>{emoji}</Text>
          <View style={s.textWrap}>
            <Text style={s.title}>{title}</Text>
            <Text style={s.subtitle}>{subtitle}</Text>
          </View>
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Feather name="x" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[s.shareBtn, { backgroundColor: btnColor }]}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Feather name="share-2" size={16} color="#FFF" />
          <Text style={s.shareBtnText}>{btnText}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 90, left: SPACING.lg, right: SPACING.lg,
    zIndex: 100,
  },
  card: {
    backgroundColor: '#FFF', borderRadius: RADIUS['2xl'],
    padding: SPACING.base, ...SHADOWS.xl,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.md },
  emoji: { fontSize: 28 },
  textWrap: { flex: 1 },
  title: { fontFamily: FONTS.heading, fontSize: FONT_SIZE.base, color: COLORS.text, marginBottom: 2 },
  subtitle: { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, lineHeight: 18 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.base,
    borderRadius: RADIUS.xl,
  },
  shareBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZE.sm, color: '#FFF' },
});

export default ExtremeScoreSharePrompt;
