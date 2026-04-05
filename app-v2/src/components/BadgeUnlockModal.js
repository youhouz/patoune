import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Share,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, SHADOWS } from '../utils/colors';

const BADGE_DEFS = {
  first_scan:  { icon: 'camera', label: 'Premier Scan', desc: 'Vous avez scanne votre premier produit !', color: '#6B8F71' },
  scanner_10:  { icon: 'zap', label: 'Explorateur', desc: '10 produits scannes ! Vous etes sur la bonne voie.', color: '#527A56' },
  scanner_50:  { icon: 'award', label: 'Expert', desc: '50 produits analyses ! Vous etes un expert.', color: '#C4956A' },
  scanner_100: { icon: 'star', label: 'Master Scanner', desc: '100 scans ! Rien ne vous echappe.', color: '#C25B4A' },
  streak_3:    { icon: 'trending-up', label: 'Regulier', desc: '3 jours de suite ! La regularite paie.', color: '#5B7FC2' },
  streak_7:    { icon: 'target', label: 'Assidu', desc: '7 jours de suite ! Votre animal est entre de bonnes mains.', color: '#8B5CF6' },
  streak_30:   { icon: 'shield', label: 'Inarretable', desc: '30 jours ! Vous etes un protecteur hors pair.', color: '#EAB308' },
  referral_1:  { icon: 'users', label: 'Ambassadeur', desc: 'Votre premier filleul ! Merci de partager Pepete.', color: '#6B8F71' },
  referral_5:  { icon: 'gift', label: 'Influenceur', desc: '5 amis parraines ! Vous faites la difference.', color: '#C4956A' },
  referral_10: { icon: 'heart', label: 'Parrain VIP', desc: '10 filleuls ! Vous etes un vrai ambassadeur.', color: '#C25B4A' },
};

const BadgeUnlockModal = ({ visible, badgeKey, onClose }) => {
  const badge = BADGE_DEFS[badgeKey] || null;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && badge) {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
      confettiAnim.setValue(0);
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
        Animated.timing(confettiAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, badge]);

  if (!badge) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `J'ai debloque le badge "${badge.label}" sur Pepete ! ${badge.desc}\n\nProtege ton animal toi aussi ➡️ pepete.fr`,
      });
    } catch (_) {}
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Confetti dots */}
          {[...Array(8)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.confettiDot,
                {
                  backgroundColor: ['#6B8F71', '#C4956A', '#5B7FC2', '#EAB308', '#C25B4A', '#8B5CF6', '#527A56', '#D4AD86'][i],
                  top: [20, 30, 60, 15, 50, 25, 70, 40][i] + '%',
                  left: [10, 80, 20, 70, 5, 90, 15, 85][i] + '%',
                  opacity: confettiAnim,
                  transform: [{
                    translateY: confettiAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -20 - i * 5],
                    }),
                  }],
                },
              ]}
            />
          ))}

          <Text style={styles.emoji}>🎉</Text>

          <View style={[styles.badgeCircle, { backgroundColor: badge.color + '15' }]}>
            <Feather name={badge.icon} size={36} color={badge.color} />
          </View>

          <Text style={styles.unlockLabel}>Badge debloque !</Text>
          <Text style={[styles.badgeName, { color: badge.color }]}>{badge.label}</Text>
          <Text style={styles.badgeDesc}>{badge.desc}</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.shareBtn, { backgroundColor: badge.color }]}
              onPress={handleShare}
              activeOpacity={0.85}
            >
              <Feather name="share-2" size={16} color="#FFF" />
              <Text style={styles.shareBtnText}>Partager</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeBtnText}>Super !</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS['3xl'],
    padding: SPACING['2xl'],
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
    ...SHADOWS.xl,
  },
  confettiDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emoji: {
    fontSize: 40,
    marginBottom: SPACING.md,
  },
  badgeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  unlockLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  badgeName: {
    fontSize: FONT_SIZE['2xl'] || 24,
    fontWeight: '900',
    marginBottom: SPACING.sm,
    letterSpacing: -0.3,
  },
  badgeDesc: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.xl,
  },
  shareBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: '#FFF',
  },
  closeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.background,
  },
  closeBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
});

export default BadgeUnlockModal;
