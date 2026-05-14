import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Share,
  TextInput,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS, FONT_SIZE, SHADOWS } from '../utils/colors';

const PROMPT_KEY = 'satisfaction_prompt_state';
const MIN_SCANS_TO_SHOW = 5;
const COOLDOWN_DAYS = 30;

/**
 * Lightweight NPS-style satisfaction prompt.
 * Shows after MIN_SCANS_TO_SHOW scans, max once per COOLDOWN_DAYS.
 * Flow: Rating (1-5 stars) → If happy: share CTA / If not: feedback text
 */
const SatisfactionPrompt = ({ totalScans, onSubmitFeedback }) => {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState('rate'); // 'rate' | 'happy' | 'feedback' | 'done'
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkShouldShow();
  }, [totalScans]);

  const checkShouldShow = async () => {
    if (!totalScans || totalScans < MIN_SCANS_TO_SHOW) return;
    try {
      const stored = await AsyncStorage.getItem(PROMPT_KEY);
      if (stored) {
        const { lastShown, dismissed } = JSON.parse(stored);
        if (dismissed) return;
        const daysSince = (Date.now() - lastShown) / (1000 * 60 * 60 * 24);
        if (daysSince < COOLDOWN_DAYS) return;
      }
      // Show prompt
      setVisible(true);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      await AsyncStorage.setItem(PROMPT_KEY, JSON.stringify({ lastShown: Date.now(), dismissed: false }));
    } catch (_) {}
  };

  const handleRate = (stars) => {
    setRating(stars);
    if (stars >= 4) {
      setStep('happy');
    } else {
      setStep('feedback');
    }
  };

  const handleDismiss = async () => {
    setVisible(false);
    await AsyncStorage.setItem(PROMPT_KEY, JSON.stringify({ lastShown: Date.now(), dismissed: true }));
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Je recommande Pepete pour analyser les croquettes de ton animal ! Scanne et découvre la qualité ➡️ pepete.fr',
      });
    } catch (_) {}
    setStep('done');
    setTimeout(() => setVisible(false), 1500);
  };

  const handleSendFeedback = async () => {
    if (onSubmitFeedback && feedbackText.trim()) {
      onSubmitFeedback({ rating, feedback: feedbackText.trim() });
    }
    setStep('done');
    setTimeout(() => setVisible(false), 1500);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={handleDismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Feather name="x" size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>

          {step === 'rate' && (
            <>
              <Text style={styles.emoji}>🐾</Text>
              <Text style={styles.title}>Comment trouvez-vous Pepete ?</Text>
              <Text style={styles.subtitle}>Votre avis nous aide a ameliorer l'app</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(s => (
                  <TouchableOpacity key={s} onPress={() => handleRate(s)} activeOpacity={0.7} style={styles.starBtn}>
                    <Feather
                      name={s <= rating ? 'star' : 'star'}
                      size={36}
                      color={s <= rating ? '#EAB308' : COLORS.borderLight}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {step === 'happy' && (
            <>
              <Text style={styles.emoji}>🎉</Text>
              <Text style={styles.title}>Merci !</Text>
              <Text style={styles.subtitle}>
                Ravi que Pepete vous plaise ! Partagez avec vos amis pour proteger plus d'animaux.
              </Text>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
                <Feather name="share-2" size={18} color="#FFF" />
                <Text style={styles.shareBtnText}>Recommander Pepete</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setStep('done'); setTimeout(() => setVisible(false), 800); }} style={styles.skipLink}>
                <Text style={styles.skipText}>Plus tard</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'feedback' && (
            <>
              <Text style={styles.emoji}>💬</Text>
              <Text style={styles.title}>Comment ameliorer ?</Text>
              <Text style={styles.subtitle}>
                Dites-nous ce qu'on peut faire mieux
              </Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder="Votre suggestion..."
                placeholderTextColor={COLORS.textTertiary}
                value={feedbackText}
                onChangeText={setFeedbackText}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.sendBtn, !feedbackText.trim() && styles.sendBtnDisabled]}
                onPress={handleSendFeedback}
                disabled={!feedbackText.trim()}
                activeOpacity={0.85}
              >
                <Text style={styles.sendBtnText}>Envoyer</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'done' && (
            <>
              <Text style={styles.emoji}>✅</Text>
              <Text style={styles.title}>Merci beaucoup !</Text>
              <Text style={styles.subtitle}>Votre retour est precieux</Text>
            </>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center', padding: SPACING.xl,
  },
  card: {
    backgroundColor: '#FFF', borderRadius: RADIUS['3xl'],
    padding: SPACING['2xl'], alignItems: 'center',
    width: '100%', maxWidth: 360, ...SHADOWS.xl,
  },
  closeBtn: {
    position: 'absolute', top: SPACING.base, right: SPACING.base, zIndex: 1,
  },
  emoji: { fontSize: 44, marginBottom: SPACING.md },
  title: {
    fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.text,
    textAlign: 'center', marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm, fontWeight: '500', color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 20, marginBottom: SPACING.xl,
  },
  starsRow: {
    flexDirection: 'row', gap: SPACING.sm,
  },
  starBtn: { padding: 4 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, backgroundColor: '#6B8F71',
    paddingHorizontal: SPACING['2xl'], paddingVertical: SPACING.base,
    borderRadius: RADIUS.full, width: '100%', ...SHADOWS.sm,
  },
  shareBtnText: { fontSize: FONT_SIZE.base, fontWeight: '700', color: '#FFF' },
  skipLink: { marginTop: SPACING.base },
  skipText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textTertiary },
  feedbackInput: {
    width: '100%', minHeight: 100, backgroundColor: COLORS.background,
    borderRadius: RADIUS.xl, padding: SPACING.base,
    fontSize: FONT_SIZE.sm, color: COLORS.text, marginBottom: SPACING.base,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  sendBtn: {
    backgroundColor: '#6B8F71', paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.base, borderRadius: RADIUS.full, width: '100%',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { fontSize: FONT_SIZE.base, fontWeight: '700', color: '#FFF' },
});

export default SatisfactionPrompt;
