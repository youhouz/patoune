import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { showAlert } from '../../utils/alert';
import api from '../../api/client';
import { FONTS, TEXT_STYLES } from '../../utils/typography';
import PepeteLogo from '../../components/PepeteLogo';
const colors = require('../../utils/colors');
const { SHADOWS, RADIUS, SPACING, FONT_SIZE } = require('../../utils/colors');

const HEADER_PADDING_TOP = Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12;
const APP_VERSION = '1.0.0';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animated section wrapper with staggered entry
const AnimatedSection = ({ children, index, style }) => {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(25)).current;

  useEffect(() => {
    const delay = 150 + index * 130;
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 450,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slide, {
        toValue: 0,
        tension: 55,
        friction: 9,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        { opacity: fade, transform: [{ translateY: slide }] },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Pressable card with scale micro-interaction
const PressableCard = ({ children, onPress, style }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 60,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  if (!onPress) {
    return <View style={style}>{children}</View>;
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={style}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const SettingsScreen = ({ navigation }) => {
  const { user, updateUser, logout } = useAuth();

  // Personal info
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setSaving] = useState(false);

  // Notification preferences (local state)
  const [notifPush, setNotifPush] = useState(true);
  const [notifScans, setNotifScans] = useState(true);
  const [notifBookings, setNotifBookings] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);

  // Header animation
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-15)).current;
  const backScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(headerSlide, {
        toValue: 0,
        tension: 60,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const hasChanges =
    name.trim() !== (user?.name || '') || phone.trim() !== (user?.phone || '');

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Champ requis', 'Le nom ne peut pas etre vide');
      return;
    }

    setSaving(true);
    try {
      const response = await api.put('/users/me', {
        name: name.trim(),
        phone: phone.trim(),
      });
      updateUser(response.data.user);
      showAlert('Succes', 'Votre profil a ete mis a jour');
    } catch (error) {
      showAlert('Erreur', 'Impossible de mettre a jour le profil. Reessayez.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Voulez-vous vraiment vous deconnecter ?')) {
        logout();
      }
      return;
    }
    showAlert(
      'Deconnexion',
      'Etes-vous sur de vouloir vous deconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se deconnecter',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  // Build user initials
  const getInitials = () => {
    const n = user?.name || '';
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return n.substring(0, 2).toUpperCase() || '?';
  };

  const handleBackPressIn = () => {
    Animated.spring(backScale, {
      toValue: 0.88,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleBackPressOut = () => {
    Animated.spring(backScale, {
      toValue: 1,
      tension: 60,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  // Grouped setting row renderer
  const renderSettingRow = ({
    icon,
    label,
    description,
    value,
    onValueChange,
    isLast,
    accentColor,
  }) => (
    <View
      style={[
        styles.settingRow,
        !isLast && styles.settingRowBorder,
      ]}
    >
      <View
        style={[
          styles.settingIconContainer,
          { backgroundColor: (accentColor || '#FF6B35') + '15' },
        ]}
      >
        <Text style={styles.settingIcon}>{icon}</Text>
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: colors.border,
          true: (accentColor || '#FF6B35') + '70',
        }}
        thumbColor={value ? accentColor || '#FF6B35' : '#f4f3f4'}
        ios_backgroundColor={colors.border}
      />
    </View>
  );

  // Info row renderer (non-interactive)
  const renderInfoRow = ({ icon, label, value, isLast }) => (
    <View
      style={[
        styles.infoRow,
        !isLast && styles.settingRowBorder,
      ]}
    >
      <View style={styles.infoIconContainer}>
        <Text style={styles.infoIcon}>{icon}</Text>
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValueBadge}>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Premium Gradient Header */}
      <LinearGradient
        colors={['#FF6B35', '#FF7E45', '#FF9A60']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Decorative elements */}
        <View style={styles.headerDecorCircle1} />
        <View style={styles.headerDecorCircle2} />

        <Animated.View
          style={[
            styles.headerInner,
            {
              opacity: headerFade,
              transform: [{ translateY: headerSlide }],
            },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: backScale }] }}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              onPressIn={handleBackPressIn}
              onPressOut={handleBackPressOut}
              activeOpacity={1}
            >
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.headerTitle}>Reglages</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>
      </LinearGradient>

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
          {/* Section: Account */}
          <AnimatedSection index={0} style={styles.section}>
            <Text style={styles.sectionTitle}>Compte</Text>
            <View style={styles.sectionCard}>
              {/* Premium mini profile header */}
              <View style={styles.accountHeader}>
                <View style={styles.accountAvatar}>
                  <LinearGradient
                    colors={['#FF6B35', '#FF8F65', '#FFB088']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.accountAvatarGradient}
                  >
                    <Text style={styles.accountAvatarText}>
                      {getInitials()}
                    </Text>
                  </LinearGradient>
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>
                    {user?.name || 'Utilisateur'}
                  </Text>
                  <Text style={styles.accountEmail}>
                    {user?.email || ''}
                  </Text>
                </View>
                {user?.isPetSitter && (
                  <View style={styles.sitterTag}>
                    <Text style={styles.sitterTagIcon}>✓</Text>
                    <Text style={styles.sitterTagText}>Gardien</Text>
                  </View>
                )}
              </View>

              <View style={styles.accountDivider} />

              {/* Editable fields */}
              <View style={styles.field}>
                <Text style={styles.label}>Nom complet</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>👤</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Votre nom"
                    placeholderTextColor={colors.placeholder}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Email (read-only) */}
              <View style={styles.field}>
                <Text style={styles.label}>Adresse email</Text>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyIcon}>✉️</Text>
                  <Text style={styles.readOnlyText} numberOfLines={1}>
                    {user?.email || ''}
                  </Text>
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedIcon}>✓</Text>
                  </View>
                </View>
              </View>

              {/* Phone */}
              <View style={styles.fieldLast}>
                <Text style={styles.label}>Telephone</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>📱</Text>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="06 12 34 56 78"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>

            {/* Save Button (only shows when changes exist) */}
            {hasChanges && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                activeOpacity={0.85}
                disabled={loading}
              >
                <LinearGradient
                  colors={
                    loading
                      ? [colors.textLight, colors.textTertiary]
                      : ['#FF6B35', '#FF8F65']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Text style={styles.saveIcon}>💾</Text>
                      <Text style={styles.saveText}>Sauvegarder</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </AnimatedSection>

          {/* Section: Notifications */}
          <AnimatedSection index={1} style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.sectionCard}>
              {renderSettingRow({
                icon: '🔔',
                label: 'Notifications push',
                description: 'Recevoir les notifications sur votre appareil',
                value: notifPush,
                onValueChange: setNotifPush,
                accentColor: '#FF6B35',
              })}
              {renderSettingRow({
                icon: '📷',
                label: 'Alertes de scans',
                description: 'Resultats de vos scans de produits',
                value: notifScans,
                onValueChange: setNotifScans,
                accentColor: '#3B82F6',
              })}
              {renderSettingRow({
                icon: '📅',
                label: 'Rappels de gardes',
                description: 'Rappels pour vos reservations',
                value: notifBookings,
                onValueChange: setNotifBookings,
                accentColor: '#10B981',
              })}
              {renderSettingRow({
                icon: '💬',
                label: 'Messages',
                description: 'Nouveaux messages de gardiens',
                value: notifMessages,
                onValueChange: setNotifMessages,
                accentColor: '#5B5BD6',
                isLast: true,
              })}
            </View>
          </AnimatedSection>

          {/* Section: About */}
          <AnimatedSection index={2} style={styles.section}>
            <Text style={styles.sectionTitle}>A propos</Text>
            <View style={styles.sectionCard}>
              {/* Premium app branding row */}
              <View style={styles.aboutBranding}>
                <PepeteLogo size={48} variant="icon" theme="brand" />
                <View style={styles.aboutBrandInfo}>
                  <Text style={styles.aboutAppName}>Pépète</Text>
                  <Text style={styles.aboutTagline}>
                    Le compagnon de vos compagnons
                  </Text>
                </View>
              </View>

              <View style={styles.aboutDivider} />

              {renderInfoRow({
                icon: '📱',
                label: 'Version',
                value: `v${APP_VERSION}`,
              })}
              {renderInfoRow({
                icon: '🏷️',
                label: 'Build',
                value: 'Expo',
              })}
              {renderInfoRow({
                icon: '📲',
                label: 'Plateforme',
                value: `${Platform.OS === 'ios' ? 'iOS' : 'Android'} ${Platform.Version}`,
                isLast: true,
              })}
            </View>
          </AnimatedSection>

          {/* Section: Danger Zone */}
          <AnimatedSection index={3} style={styles.section}>
            <Text style={styles.sectionTitle}>Zone de danger</Text>
            <PressableCard
              style={styles.logoutCard}
              onPress={handleLogout}
            >
              <View style={styles.logoutIconContainer}>
                <Text style={styles.logoutIcon}>🚪</Text>
              </View>
              <View style={styles.logoutInfo}>
                <Text style={styles.logoutTitle}>Se deconnecter</Text>
                <Text style={styles.logoutSubtitle}>
                  Deconnectez-vous de votre compte
                </Text>
              </View>
              <View style={styles.logoutChevronContainer}>
                <Text style={styles.logoutArrow}>›</Text>
              </View>
            </PressableCard>
          </AnimatedSection>

          {/* Premium Footer */}
          <AnimatedSection index={4} style={styles.footer}>
            <View style={styles.footerDivider} />
            <Text style={styles.footerHeart}>
              Fait avec amour pour vos compagnons
            </Text>
            <Text style={styles.footerCopy}>
              Pépète v{APP_VERSION}
            </Text>
          </AnimatedSection>

          <View style={styles.bottomSpacer} />
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
    paddingTop: SPACING.xl,
    paddingBottom: SPACING['3xl'],
  },

  // Premium Gradient Header
  header: {
    paddingTop: HEADER_PADDING_TOP,
    paddingBottom: SPACING.base + 4,
    paddingHorizontal: SPACING.lg,
    overflow: 'hidden',
    borderBottomLeftRadius: RADIUS['2xl'],
    borderBottomRightRadius: RADIUS['2xl'],
  },
  headerDecorCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerDecorCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  backArrow: {
    fontSize: 28,
    color: colors.white,
    fontWeight: '600',
    marginTop: -2,
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.brand,
    fontSize: FONT_SIZE.xl + 2,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerSpacer: {
    width: 40,
  },

  // Sections — more breathing room
  section: {
    marginBottom: SPACING.xl + 4,
  },
  sectionTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.xs + 1,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: SPACING.md + 2,
    marginLeft: SPACING.xs,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: RADIUS.xl + 2,
    padding: SPACING.base + 4,
    ...SHADOWS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.02)',
  },

  // Account header — premium styling
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base + 2,
  },
  accountAvatar: {
    borderRadius: 26,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  accountAvatarGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountAvatarText: {
    fontFamily: FONTS.brand,
    fontSize: FONT_SIZE.lg,
    color: colors.white,
    letterSpacing: 0.5,
  },
  accountInfo: {
    flex: 1,
    marginLeft: SPACING.md + 2,
  },
  accountName: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.base + 1,
    color: colors.text,
    marginBottom: 2,
  },
  accountEmail: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
  },
  sitterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98112',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.full,
    gap: 4,
    borderWidth: 1,
    borderColor: '#10B98120',
  },
  sitterTagIcon: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '800',
  },
  sitterTagText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.xs,
    color: '#10B981',
  },
  accountDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginBottom: SPACING.base + 2,
  },

  // Fields — refined inputs
  field: {
    marginBottom: SPACING.lg + 2,
  },
  fieldLast: {
    marginBottom: 0,
  },
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    marginBottom: SPACING.sm + 1,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: RADIUS.lg + 2,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    paddingHorizontal: SPACING.base,
    overflow: 'hidden',
  },
  inputIcon: {
    fontSize: 15,
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    paddingVertical: SPACING.md + 3,
    fontSize: FONT_SIZE.base,
    color: colors.text,
  },

  // Read-only email field
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: RADIUS.lg + 2,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md + 3,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    opacity: 0.7,
  },
  readOnlyIcon: {
    fontSize: 15,
    marginRight: SPACING.sm,
  },
  readOnlyText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.base,
    color: colors.textSecondary,
  },
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  verifiedIcon: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '800',
  },

  // Save Button
  saveButton: {
    borderRadius: RADIUS.xl + 2,
    overflow: 'hidden',
    marginTop: SPACING.base + 2,
    ...SHADOWS.glow('#FF6B35'),
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base + 2,
    borderRadius: RADIUS.xl + 2,
    gap: SPACING.sm,
  },
  saveIcon: {
    fontSize: 17,
  },
  saveText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.md,
    color: colors.white,
    letterSpacing: 0.3,
  },

  // Setting Rows (with toggle)
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md + 2,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  settingIcon: {
    fontSize: 20,
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  settingLabel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.base,
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
  },

  // Info Rows (non-interactive) — premium badges
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md + 2,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  infoIcon: {
    fontSize: 15,
  },
  infoLabel: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
  },
  infoValueBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  infoValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.xs + 1,
    color: colors.text,
  },

  // About Section — premium branding
  aboutBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base + 2,
  },
  aboutLogoContainer: {
    borderRadius: RADIUS.lg + 2,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  aboutLogoGradient: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutLogoIcon: {
    fontSize: 26,
  },
  aboutBrandInfo: {
    marginLeft: SPACING.md + 2,
  },
  aboutAppName: {
    fontFamily: FONTS.brand,
    fontSize: FONT_SIZE.xl,
    color: colors.text,
    letterSpacing: 0.5,
  },
  aboutTagline: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  aboutDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginBottom: SPACING.sm + 2,
  },

  // Logout — premium card
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: RADIUS.xl + 2,
    padding: SPACING.base + 4,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.10)',
    ...SHADOWS.md,
  },
  logoutIconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg + 2,
    backgroundColor: colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    fontSize: 22,
  },
  logoutInfo: {
    flex: 1,
    marginLeft: SPACING.md + 2,
  },
  logoutTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.base,
    color: colors.error,
    marginBottom: 2,
  },
  logoutSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
  },
  logoutChevronContainer: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutArrow: {
    fontSize: 22,
    color: colors.error,
    fontWeight: '600',
    opacity: 0.6,
    marginTop: -1,
  },

  // Premium Footer
  footer: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  footerDivider: {
    width: 40,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.borderLight,
    marginBottom: SPACING.lg,
  },
  footerHeart: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.sm,
    color: colors.textTertiary,
    marginBottom: SPACING.xs + 2,
  },
  footerCopy: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.xs,
    color: colors.textLight,
  },

  bottomSpacer: {
    height: SPACING['2xl'],
  },
});

export default SettingsScreen;
