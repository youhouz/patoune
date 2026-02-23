import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { FONTS } from '../../utils/typography';
const { COLORS, SHADOWS, RADIUS, SPACING, FONT_SIZE } = require('../../utils/colors');

const APP_VERSION = '2.0.0';

const SettingsScreen = ({ navigation }) => {
  const { user, updateUser, logout } = useAuth();
  const insets = useSafeAreaInsets();

  // Personal info
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setSaving] = useState(false);

  // Notification preferences (local state)
  const [notifPush, setNotifPush] = useState(true);
  const [notifScans, setNotifScans] = useState(true);
  const [notifBookings, setNotifBookings] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const hasChanges =
    name.trim() !== (user?.name || '') || phone.trim() !== (user?.phone || '');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Champ requis', 'Le nom ne peut pas etre vide');
      return;
    }

    setSaving(true);
    try {
      const response = await api.put('/users/me', {
        name: name.trim(),
        phone: phone.trim(),
      });
      updateUser(response.data.user);
      Alert.alert('Succes', 'Votre profil a ete mis a jour');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre a jour le profil. Reessayez.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
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

  // Role display helper
  const getRoleLabel = () => {
    const role = user?.role;
    if (role === 'guardian') return 'Gardien';
    if (role === 'both') return 'Gardien & Proprietaire';
    return 'Proprietaire';
  };

  // Grouped setting row renderer
  const renderSettingRow = ({
    iconName,
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
          { backgroundColor: (accentColor || COLORS.primary) + '15' },
        ]}
      >
        <Feather name={iconName} size={18} color={accentColor || COLORS.primary} />
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
          false: COLORS.border,
          true: (accentColor || COLORS.primary) + '70',
        }}
        thumbColor={value ? accentColor || COLORS.primary : '#f4f3f4'}
        ios_backgroundColor={COLORS.border}
      />
    </View>
  );

  // Info row renderer (non-interactive)
  const renderInfoRow = ({ iconName, label, value, isLast }) => (
    <View
      style={[
        styles.infoRow,
        !isLast && styles.settingRowBorder,
      ]}
    >
      <View style={styles.infoIconContainer}>
        <Feather name={iconName} size={16} color={COLORS.pebble} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={COLORS.charcoal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reglages</Text>
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
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Section: Account */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Compte</Text>
              <View style={styles.sectionCard}>
                {/* Mini profile header */}
                <View style={styles.accountHeader}>
                  <View style={styles.accountAvatar}>
                    <LinearGradient
                      colors={COLORS.gradientPrimary}
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
                  <View style={styles.tagRow}>
                    {user?.isPetSitter && (
                      <View style={styles.sitterTag}>
                        <Text style={styles.sitterTagText}>Gardien</Text>
                      </View>
                    )}
                    <View style={styles.roleTag}>
                      <Text style={styles.roleTagText}>{getRoleLabel()}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.accountDivider} />

                {/* Editable fields */}
                <View style={styles.field}>
                  <Text style={styles.label}>Nom complet</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Votre nom"
                    placeholderTextColor={COLORS.placeholder}
                    autoCapitalize="words"
                  />
                </View>

                {/* Email (read-only) */}
                <View style={styles.field}>
                  <Text style={styles.label}>Adresse email</Text>
                  <View style={styles.readOnlyField}>
                    <Feather name="mail" size={14} color={COLORS.pebble} style={{ marginRight: SPACING.sm }} />
                    <Text style={styles.readOnlyText} numberOfLines={1}>
                      {user?.email || ''}
                    </Text>
                    <View style={styles.verifiedBadge}>
                      <Feather name="check" size={11} color={COLORS.white} />
                    </View>
                  </View>
                </View>

                {/* Phone */}
                <View style={styles.fieldLast}>
                  <Text style={styles.label}>Telephone</Text>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="06 12 34 56 78"
                    placeholderTextColor={COLORS.placeholder}
                    keyboardType="phone-pad"
                  />
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
                        ? [COLORS.sand, COLORS.pebble]
                        : COLORS.gradientPrimary
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveGradient}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <Feather name="save" size={16} color={COLORS.white} />
                        <Text style={styles.saveText}>Sauvegarder</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            {/* Section: Notifications */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notifications</Text>
              <View style={styles.sectionCard}>
                {renderSettingRow({
                  iconName: 'bell',
                  label: 'Notifications push',
                  description: 'Recevoir les notifications sur votre appareil',
                  value: notifPush,
                  onValueChange: setNotifPush,
                  accentColor: COLORS.primary,
                })}
                {renderSettingRow({
                  iconName: 'camera',
                  label: 'Alertes de scans',
                  description: 'Resultats de vos scans de produits',
                  value: notifScans,
                  onValueChange: setNotifScans,
                  accentColor: COLORS.secondary,
                })}
                {renderSettingRow({
                  iconName: 'calendar',
                  label: 'Rappels de gardes',
                  description: 'Rappels pour vos reservations',
                  value: notifBookings,
                  onValueChange: setNotifBookings,
                  accentColor: COLORS.success,
                })}
                {renderSettingRow({
                  iconName: 'message-circle',
                  label: 'Messages',
                  description: 'Nouveaux messages de gardiens',
                  value: notifMessages,
                  onValueChange: setNotifMessages,
                  accentColor: COLORS.accent,
                  isLast: true,
                })}
              </View>
            </View>

            {/* Section: About */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>A propos</Text>
              <View style={styles.sectionCard}>
                {/* App branding row */}
                <View style={styles.aboutBranding}>
                  <View style={styles.aboutLogoContainer}>
                    <LinearGradient
                      colors={COLORS.gradientPrimary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.aboutLogoGradient}
                    >
                      <Feather name="heart" size={24} color={COLORS.white} />
                    </LinearGradient>
                  </View>
                  <View style={styles.aboutBrandInfo}>
                    <Text style={styles.aboutAppName}>Patoune</Text>
                    <Text style={styles.aboutTagline}>
                      Le compagnon de vos compagnons
                    </Text>
                  </View>
                </View>

                <View style={styles.aboutDivider} />

                {renderInfoRow({
                  iconName: 'smartphone',
                  label: 'Version',
                  value: `v${APP_VERSION}`,
                })}
                {renderInfoRow({
                  iconName: 'tag',
                  label: 'Build',
                  value: 'Expo',
                })}
                {renderInfoRow({
                  iconName: 'monitor',
                  label: 'Plateforme',
                  value: `${Platform.OS === 'ios' ? 'iOS' : 'Android'} ${Platform.Version}`,
                  isLast: true,
                })}
              </View>
            </View>

            {/* Section: Danger Zone */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Zone de danger</Text>
              <TouchableOpacity
                style={styles.logoutCard}
                onPress={handleLogout}
                activeOpacity={0.6}
              >
                <View style={styles.logoutIconContainer}>
                  <Feather name="log-out" size={20} color={COLORS.error} />
                </View>
                <View style={styles.logoutInfo}>
                  <Text style={styles.logoutTitle}>Se deconnecter</Text>
                  <Text style={styles.logoutSubtitle}>
                    Deconnectez-vous de votre compte
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={COLORS.error} style={{ opacity: 0.5 }} />
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerHeart}>
                Fait avec amour pour vos compagnons
              </Text>
              <Text style={styles.footerCopy}>
                Patoune v{APP_VERSION}
              </Text>
            </View>

            <View style={styles.bottomSpacer} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
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
    paddingBottom: SPACING.base,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.cream,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontFamily: FONTS.heading,
    color: COLORS.charcoal,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  headerSpacer: {
    width: 36,
  },

  // Sections
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.stone,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    ...SHADOWS.md,
  },

  // Account header
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
    flexWrap: 'wrap',
  },
  accountAvatar: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  accountAvatarGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountAvatarText: {
    fontSize: FONT_SIZE.md,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  accountInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  accountName: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.heading,
    color: COLORS.charcoal,
    marginBottom: 1,
  },
  accountEmail: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.body,
    color: COLORS.stone,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sitterTag: {
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  sitterTagText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.success,
  },
  roleTag: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  roleTagText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.primary,
  },
  accountDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.base,
  },

  // Fields
  field: {
    marginBottom: SPACING.lg,
  },
  fieldLast: {
    marginBottom: 0,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.charcoal,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.linen,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md + 2,
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.body,
    color: COLORS.charcoal,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },

  // Read-only email field
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.linen,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md + 2,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    opacity: 0.7,
  },
  readOnlyText: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.body,
    color: COLORS.stone,
  },
  verifiedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Save Button
  saveButton: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginTop: SPACING.base,
    ...SHADOWS.glow(COLORS.primary),
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.xl,
    gap: SPACING.sm,
  },
  saveText: {
    fontSize: FONT_SIZE.md,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    letterSpacing: 0.3,
  },

  // Setting Rows (with toggle)
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  settingLabel: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.charcoal,
    marginBottom: 1,
  },
  settingDescription: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.body,
    color: COLORS.pebble,
  },

  // Info Rows (non-interactive)
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  infoIconContainer: {
    width: 24,
    marginRight: SPACING.md,
    alignItems: 'center',
  },
  infoLabel: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.stone,
  },
  infoValue: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.charcoal,
  },

  // About Section
  aboutBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  aboutLogoContainer: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  aboutLogoGradient: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutBrandInfo: {
    marginLeft: SPACING.md,
  },
  aboutAppName: {
    fontSize: FONT_SIZE.lg,
    fontFamily: FONTS.brand,
    color: COLORS.charcoal,
    letterSpacing: 0.3,
  },
  aboutTagline: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.stone,
    marginTop: 1,
  },
  aboutDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.sm,
  },

  // Logout
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: 'rgba(199, 80, 80, 0.12)',
    ...SHADOWS.sm,
  },
  logoutIconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  logoutTitle: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.heading,
    color: COLORS.error,
    marginBottom: 1,
  },
  logoutSubtitle: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.body,
    color: COLORS.pebble,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  footerHeart: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.body,
    color: COLORS.pebble,
    marginBottom: SPACING.xs,
  },
  footerCopy: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.sand,
  },

  bottomSpacer: {
    height: SPACING['2xl'],
  },
});

export default SettingsScreen;
