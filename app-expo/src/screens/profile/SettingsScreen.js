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
  StatusBar,
  KeyboardAvoidingView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
const colors = require('../../utils/colors');
const { SHADOWS, RADIUS, SPACING, FONT_SIZE } = require('../../utils/colors');

const HEADER_PADDING_TOP = Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12;
const APP_VERSION = '1.0.0';

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
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>‹</Text>
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
                      colors={['#FF6B35', '#FF8F65']}
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
                      <Text style={styles.sitterTagText}>Gardien</Text>
                    </View>
                  )}
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
                    placeholderTextColor={colors.placeholder}
                    autoCapitalize="words"
                  />
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
            </View>

            {/* Section: Notifications */}
            <View style={styles.section}>
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
                  accentColor: '#6C5CE7',
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
                      colors={['#FF6B35', '#FF8F65']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.aboutLogoGradient}
                    >
                      <Text style={styles.aboutLogoIcon}>🐾</Text>
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
                  <Text style={styles.logoutIcon}>🚪</Text>
                </View>
                <View style={styles.logoutInfo}>
                  <Text style={styles.logoutTitle}>Se deconnecter</Text>
                  <Text style={styles.logoutSubtitle}>
                    Deconnectez-vous de votre compte
                  </Text>
                </View>
                <Text style={styles.logoutArrow}>›</Text>
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
  backArrow: {
    fontSize: 26,
    color: colors.text,
    fontWeight: '600',
    marginTop: -2,
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

  // Account header
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
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
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  accountInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  accountName: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 1,
  },
  accountEmail: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  sitterTag: {
    backgroundColor: '#10B98115',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  sitterTagText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#10B981',
  },
  accountDivider: {
    height: 1,
    backgroundColor: colors.border,
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
    fontWeight: '600',
    color: colors.text,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md + 2,
    fontSize: FONT_SIZE.base,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: colors.border,
  },

  // Read-only email field
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md + 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    opacity: 0.7,
  },
  readOnlyIcon: {
    fontSize: 14,
    marginRight: SPACING.sm,
  },
  readOnlyText: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  verifiedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedIcon: {
    fontSize: 11,
    color: colors.white,
    fontWeight: '800',
  },

  // Save Button
  saveButton: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginTop: SPACING.base,
    ...SHADOWS.glow('#FF6B35'),
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.xl,
    gap: SPACING.sm,
  },
  saveIcon: {
    fontSize: 16,
  },
  saveText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: colors.white,
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
    borderBottomColor: colors.borderLight,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  settingIcon: {
    fontSize: 18,
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  settingLabel: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 1,
  },
  settingDescription: {
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
    fontWeight: '400',
  },

  // Info Rows (non-interactive)
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: SPACING.md,
    width: 24,
    textAlign: 'center',
  },
  infoLabel: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: colors.text,
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
  aboutLogoIcon: {
    fontSize: 24,
  },
  aboutBrandInfo: {
    marginLeft: SPACING.md,
  },
  aboutAppName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.3,
  },
  aboutTagline: {
    fontSize: FONT_SIZE.xs,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  aboutDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: SPACING.sm,
  },

  // Logout
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.12)',
    ...SHADOWS.sm,
  },
  logoutIconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    fontSize: 20,
  },
  logoutInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  logoutTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: colors.error,
    marginBottom: 1,
  },
  logoutSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
    fontWeight: '400',
  },
  logoutArrow: {
    fontSize: 20,
    color: colors.error,
    fontWeight: '600',
    opacity: 0.5,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  footerHeart: {
    fontSize: FONT_SIZE.sm,
    color: colors.textTertiary,
    fontWeight: '400',
    marginBottom: SPACING.xs,
  },
  footerCopy: {
    fontSize: FONT_SIZE.xs,
    color: colors.textLight,
    fontWeight: '500',
  },

  bottomSpacer: {
    height: SPACING['2xl'],
  },
});

export default SettingsScreen;
