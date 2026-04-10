// ─────────────────────────────────────────────────────────────────────────────
// Pepete — ShareNudgeModal
// Appears after first scan to nudge sharing. Maximum viral potential.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Share,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, SHADOWS } from '../utils/colors';
import { FONTS } from '../utils/typography';
import { hapticSuccess } from '../utils/haptics';

const ShareNudgeModal = ({ visible, onClose, product }) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleShare = async () => {
    hapticSuccess();
    if (!product) { onClose(); return; }
    const score = product.nutritionScore ?? 0;
    const emoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : score >= 40 ? '🟠' : '🔴';
    const brandText = product.brand ? ` de ${product.brand}` : '';
    const link = product.barcode ? `pepete.fr/scan/${product.barcode}` : 'pepete.fr';
    try {
      await Share.share({
        message: `${emoji} Je viens de scanner ${product.name}${brandText} → ${score}/100 !\n\n🐾 Et toi, tu sais ce que mange ton animal ?\nVoir le resultat ➡️ ${link}`,
      });
    } catch (_) {}
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[s.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[s.card, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={s.emoji}>🎉</Text>
          <Text style={s.title}>Ton premier scan !</Text>
          <Text style={s.subtitle}>
            Partage le resultat avec tes potes qui ont un animal — ils vont halluciner sur ce qu'il y a dans les croquettes
          </Text>

          <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.85}>
            <Feather name="share-2" size={18} color="#FFF" />
            <Text style={s.shareBtnText}>Partager sur Snap / Insta</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.laterBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={s.laterText}>Plus tard</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: SPACING.xl,
  },
  card: {
    backgroundColor: '#FFF', borderRadius: RADIUS['3xl'],
    padding: SPACING['2xl'], alignItems: 'center',
    width: '100%', maxWidth: 340, ...SHADOWS.xl,
  },
  emoji: { fontSize: 48, marginBottom: SPACING.md },
  title: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZE.xl,
    color: COLORS.text, marginBottom: SPACING.sm, textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary, textAlign: 'center',
    lineHeight: 20, marginBottom: SPACING.xl,
  },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, backgroundColor: COLORS.primary,
    paddingVertical: SPACING.base + 2, paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.xl, width: '100%', marginBottom: SPACING.md,
  },
  shareBtnText: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZE.sm, color: '#FFF',
  },
  laterBtn: {
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg,
  },
  laterText: {
    fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZE.sm, color: COLORS.textLight,
  },
});

export default ShareNudgeModal;
