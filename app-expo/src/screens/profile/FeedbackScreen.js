import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { sendFeedbackAPI } from '../../api/feedback';
import { compressImage } from '../../utils/imageCompressor';
import { showAlert } from '../../utils/alert';
import colors, { SHADOWS, RADIUS, SPACING, FONT_SIZE } from '../../utils/colors';

const HEADER_PADDING_TOP = Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12;

const CATEGORIES = [
  { key: 'bug', icon: 'alert-circle', label: 'Bug', color: colors.error },
  { key: 'feature', icon: 'zap', label: 'Idee', color: colors.warning },
  { key: 'other', icon: 'message-circle', label: 'Autre', color: colors.primary },
];

const FeedbackScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [category, setCategory] = useState('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshots, setScreenshots] = useState([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const pickScreenshot = async () => {
    if (screenshots.length >= 3) {
      showAlert('Limite atteinte', '3 screenshots maximum');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const compressed = await compressImage(asset, { maxDimension: 600, quality: 0.5 });
      setScreenshots((prev) => [...prev, { uri: asset.uri, base64: compressed }]);
    }
  };

  const removeScreenshot = (index) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!description.trim()) {
      showAlert('Oups', 'Decris un peu le probleme !');
      return;
    }

    setSending(true);
    try {
      await sendFeedbackAPI({
        category,
        title: title.trim() || undefined,
        description: description.trim(),
        screenshots: screenshots.map((s) => s.base64),
        platform: Platform.OS,
        user: user?.email || 'anonyme',
      });

      setSent(true);
      Animated.spring(successScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      showAlert(
        'Erreur',
        err.userMessage || "Impossible d'envoyer le feedback. Reessaie plus tard !"
      );
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.successContainer}>
          <Animated.View style={[styles.successContent, { transform: [{ scale: successScale }] }]}>
            <View style={styles.successIconWrap}>
              <LinearGradient
                colors={['#527A56', '#6B8F71']}
                style={styles.successIconGradient}
              >
                <Feather name="check" size={36} color="#FFF" />
              </LinearGradient>
            </View>
            <Text style={styles.successTitle}>Merci !</Text>
            <Text style={styles.successSubtitle}>
              Ton feedback a bien ete envoye.{'\n'}On regarde ca au plus vite !
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#527A56', '#6B8F71']}
                style={styles.successButtonGradient}
              >
                <Text style={styles.successButtonText}>Retour</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Feedback</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          >
            {/* Intro */}
            <View style={styles.introCard}>
              <LinearGradient
                colors={['#527A56', '#6B8F71', '#8CB092']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.introGradient}
              >
                <Feather name="send" size={22} color="#FFF" />
                <View style={styles.introTextWrap}>
                  <Text style={styles.introTitle}>Un bug ? Une idee ?</Text>
                  <Text style={styles.introSubtitle}>
                    Dis-nous tout, on ameliore Pepete grace a toi !
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Type de retour</Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryChip,
                      category === cat.key && {
                        backgroundColor: cat.color + '15',
                        borderColor: cat.color,
                      },
                    ]}
                    onPress={() => setCategory(cat.key)}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={cat.icon}
                      size={16}
                      color={category === cat.key ? cat.color : colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.categoryLabel,
                        category === cat.key && { color: cat.color, fontWeight: '700' },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Title */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Titre (optionnel)</Text>
              <View style={styles.sectionCard}>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Le scanner plante sur Android"
                  placeholderTextColor={colors.placeholder}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <View style={styles.sectionCard}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Explique-nous ce qui se passe, les etapes pour reproduire le bug..."
                  placeholderTextColor={colors.placeholder}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  maxLength={2000}
                />
                <Text style={styles.charCount}>
                  {description.length}/2000
                </Text>
              </View>
            </View>

            {/* Screenshots */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Screenshots ({screenshots.length}/3)
              </Text>
              <View style={styles.screenshotsRow}>
                {screenshots.map((img, index) => (
                  <View key={index} style={styles.screenshotWrap}>
                    <Image source={{ uri: img.uri }} style={styles.screenshotImage} />
                    <TouchableOpacity
                      style={styles.screenshotRemove}
                      onPress={() => removeScreenshot(index)}
                      activeOpacity={0.7}
                    >
                      <Feather name="x" size={14} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ))}
                {screenshots.length < 3 && (
                  <TouchableOpacity
                    style={styles.screenshotAdd}
                    onPress={pickScreenshot}
                    activeOpacity={0.7}
                  >
                    <Feather name="camera" size={22} color={colors.primary} />
                    <Text style={styles.screenshotAddText}>Ajouter</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Send Button */}
            <TouchableOpacity
              style={[styles.sendButton, (!description.trim() || sending) && { opacity: 0.6 }]}
              onPress={handleSend}
              disabled={!description.trim() || sending}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#527A56', '#6B8F71']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sendGradient}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Feather name="send" size={18} color="#FFF" />
                    <Text style={styles.sendText}>Envoyer</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: SPACING['3xl'] }} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING['3xl'],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: HEADER_PADDING_TOP,
    paddingBottom: SPACING.base,
    paddingHorizontal: SPACING.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  headerSpacer: {
    width: 36,
  },

  // Intro card
  introCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  introGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  introTextWrap: {
    flex: 1,
  },
  introTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 2,
  },
  introSubtitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
  },

  // Sections
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    ...SHADOWS.md,
  },

  // Categories
  categoryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  categoryChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...SHADOWS.xs,
  },
  categoryLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: colors.textTertiary,
  },

  // Input
  input: {
    fontSize: FONT_SIZE.base,
    color: colors.text,
    padding: 0,
  },
  textArea: {
    minHeight: 120,
    lineHeight: 22,
  },
  charCount: {
    fontSize: FONT_SIZE.xs,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: SPACING.sm,
  },

  // Screenshots
  screenshotsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  screenshotWrap: {
    width: 90,
    height: 90,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  screenshotImage: {
    width: '100%',
    height: '100%',
  },
  screenshotRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenshotAdd: {
    width: 90,
    height: 90,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: colors.primaryMuted,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: colors.primaryUltra,
  },
  screenshotAddText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: colors.primary,
  },

  // Send
  sendButton: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.glow('#527A56'),
  },
  sendGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.xl,
    gap: SPACING.sm,
  },
  sendText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },

  // Success
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['2xl'],
  },
  successContent: {
    alignItems: 'center',
  },
  successIconWrap: {
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    ...SHADOWS.glow('#527A56'),
  },
  successIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '800',
    color: colors.text,
    marginBottom: SPACING.sm,
  },
  successSubtitle: {
    fontSize: FONT_SIZE.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING['2xl'],
  },
  successButton: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.glow('#527A56'),
  },
  successButtonGradient: {
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.xl,
  },
  successButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default FeedbackScreen;
