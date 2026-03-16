import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { PepeteIcon } from '../../components/PepeteLogo';
import api, { API_URL } from '../../api/client';
import { uploadAvatarAPI } from '../../api/auth';
import { geocodeCity } from '../../hooks/useLocation';
import { updatePetSitterAPI } from '../../api/petsitters';
import { showAlert } from '../../utils/alert';
import colors, { SHADOWS, RADIUS, SPACING, FONT_SIZE } from '../../utils/colors';

const HEADER_PADDING_TOP = Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12;
const APP_VERSION = '1.0.0';

const SettingsScreen = ({ navigation }) => {
  const { user, updateUser, logout } = useAuth();

  // Personal info
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setSaving] = useState(false);

  // City / localisation
  const [cityInput, setCityInput] = useState(user?.address?.city || '');
  const [cityCoords, setCityCoords] = useState(null);
  const [cityLoading, setCityLoading] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
  }, [fadeAnim, slideAnim]);

  const hasChanges =
    name.trim() !== (user?.name || '') ||
    phone.trim() !== (user?.phone || '') ||
    cityCoords !== null;

  const handleGeocodeCityInput = useCallback(async () => {
    if (!cityInput.trim()) return;
    setCityLoading(true);
    try {
      const result = await geocodeCity(cityInput.trim());
      if (result) {
        setCityCoords(result);
      } else {
        showAlert('Ville introuvable', 'Impossible de localiser cette ville. Essayez le format "Paris", "Lyon 69"...');
      }
    } catch (_) {
      showAlert('Erreur', 'Impossible de géocoder cette ville.');
    } finally {
      setCityLoading(false);
    }
  }, [cityInput]);

  const handleLocateMe = useCallback(async () => {
    setCityLoading(true);
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            let cityName = 'Ma position';
            try {
              const res = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`,
                { signal: AbortSignal.timeout(5000) }
              );
              if (res.ok) {
                const data = await res.json();
                cityName = data.city || data.locality || data.principalSubdivision || 'Ma position';
              }
            } catch (_) {
              // Reverse geocode failed — use fallback name
            }
            setCityInput(cityName);
            setCityCoords({ latitude, longitude, displayName: cityName });
            setCityLoading(false);
          },
          () => {
            showAlert('GPS indisponible', 'Saisissez votre ville manuellement.');
            setCityLoading(false);
          },
          { timeout: 10000 }
        );
      } else {
        const res = await fetch('https://ip-api.com/json/?lang=fr&fields=status,city,lat,lon', {
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success') {
            setCityInput(data.city || 'Ma position');
            setCityCoords({ latitude: data.lat, longitude: data.lon, displayName: data.city || 'Ma position' });
          }
        }
        setCityLoading(false);
      }
    } catch (_) {
      showAlert('Erreur', 'Impossible de récupérer votre position.');
      setCityLoading(false);
    }
  }, []);

  const handlePickAvatar = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission requise', 'Autorisez l\'acces a vos photos pour changer votre avatar.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (result.canceled) return;
      const uri = result.assets[0].uri;
      setUploadingAvatar(true);
      const res = await uploadAvatarAPI(uri);
      const updatedUser = res.data?.user;
      if (updatedUser) {
        await updateUser(updatedUser);
      }
      showAlert('Photo mise a jour', 'Votre photo de profil a ete changee.');
    } catch (err) {
      console.log('Erreur upload avatar:', err);
      showAlert('Erreur', 'Impossible de mettre a jour la photo.');
    } finally {
      setUploadingAvatar(false);
    }
  }, [updateUser]);

  const avatarUrl = user?.avatar
    ? (user.avatar.startsWith('http') ? user.avatar : `${API_URL.replace('/api', '')}${user.avatar}`)
    : null;

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      showAlert('Champ requis', 'Le nom ne peut pas être vide');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
      };

      if (cityCoords) {
        payload.location = {
          type: 'Point',
          coordinates: [cityCoords.longitude, cityCoords.latitude],
        };
        payload.address = {
          city: cityInput.trim() || cityCoords.displayName || '',
          country: 'France',
        };
      }

      const response = await api.put('/users/me', payload);
      updateUser(response.data.user);

      // Si l'utilisateur est gardien, aussi mettre à jour son profil PetSitter
      if (user?.isPetSitter && cityCoords) {
        try {
          await updatePetSitterAPI({
            location: {
              type: 'Point',
              coordinates: [cityCoords.longitude, cityCoords.latitude],
            },
          });
        } catch (_) {
          // PetSitter profile update failed silently
        }
      }

      setCityCoords(null);
      showAlert('Succès', 'Votre profil a été mis à jour');
    } catch (_) {
      showAlert('Erreur', 'Impossible de mettre à jour le profil. Réessayez.');
    } finally {
      setSaving(false);
    }
  }, [name, phone, cityCoords, cityInput, updateUser, user?.isPetSitter]);

  const doLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const handleLogout = useCallback(() => {
    if (Platform.OS === 'web') {
      doLogout();
    } else {
      showAlert(
        'Déconnexion',
        'Êtes-vous sûr de vouloir vous déconnecter ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se déconnecter', style: 'destructive', onPress: doLogout },
        ]
      );
    }
  }, [doLogout]);

  // Build user initials
  const getInitials = useCallback(() => {
    const n = user?.name || '';
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return n.substring(0, 2).toUpperCase() || '?';
  }, [user?.name]);

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
          { backgroundColor: (accentColor || '#6B8F71') + '15' },
        ]}
      >
        <Feather name={icon} size={18} color={accentColor || '#6B8F71'} />
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
          true: (accentColor || '#6B8F71') + '70',
        }}
        thumbColor={value ? accentColor || '#6B8F71' : '#f4f3f4'}
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
      <Feather name={icon} size={16} color={colors.textTertiary} style={{ marginRight: SPACING.md, width: 24, textAlign: 'center' }} />
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
          <Feather name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Réglages</Text>
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
                  <TouchableOpacity style={styles.accountAvatarWrap} onPress={handlePickAvatar} activeOpacity={0.8} disabled={uploadingAvatar}>
                    <View style={styles.accountAvatar}>
                      {uploadingAvatar ? (
                        <View style={styles.accountAvatarGradient}>
                          <ActivityIndicator size="small" color="#FFF" />
                        </View>
                      ) : avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.accountAvatarImage} />
                      ) : (
                        <LinearGradient
                          colors={['#527A56', '#6B8F71']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.accountAvatarGradient}
                        >
                          <Text style={styles.accountAvatarText}>
                            {getInitials()}
                          </Text>
                        </LinearGradient>
                      )}
                    </View>
                    <View style={styles.accountAvatarEditIcon}>
                      <Feather name="camera" size={10} color="#FFF" />
                    </View>
                  </TouchableOpacity>
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
                      <Text style={styles.sitterTagText}>Pet-sitter</Text>
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
                    <Feather name="mail" size={14} color={colors.textSecondary} style={{ marginRight: SPACING.sm }} />
                    <Text style={styles.readOnlyText} numberOfLines={1}>
                      {user?.email || ''}
                    </Text>
                    <View style={styles.verifiedBadge}>
                      <Feather name="check" size={11} color={colors.white} />
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
                        : ['#527A56', '#6B8F71']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveGradient}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <Feather name="save" size={16} color={colors.white} />
                        <Text style={styles.saveText}>Sauvegarder</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            {/* Section: Localisation */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ma localisation</Text>
              <View style={styles.sectionCard}>
                {user?.address?.city ? (
                  <View style={styles.locCurrentCityRow}>
                    <Feather name="map-pin" size={13} color="#527A56" />
                    <Text style={styles.locCurrentCity}>Ville actuelle : {user.address.city}</Text>
                  </View>
                ) : (
                  <Text style={styles.locHint}>
                    Enregistrez votre ville pour être trouvé(e) par vos voisins.
                  </Text>
                )}
                <View style={styles.cityInputRow}>
                  <TextInput
                    style={styles.cityTextInput}
                    value={cityInput}
                    onChangeText={(v) => { setCityInput(v); setCityCoords(null); }}
                    placeholder="Paris, Lyon, Marseille..."
                    placeholderTextColor={colors.placeholder}
                    autoCapitalize="words"
                    returnKeyType="search"
                    onSubmitEditing={handleGeocodeCityInput}
                  />
                  <TouchableOpacity
                    style={[styles.citySearchBtn, (!cityInput.trim() || cityLoading) && { opacity: 0.6 }]}
                    onPress={handleGeocodeCityInput}
                    activeOpacity={0.8}
                    disabled={cityLoading || !cityInput.trim()}
                  >
                    {cityLoading ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Feather name="search" size={18} color={colors.white} />
                    )}
                  </TouchableOpacity>
                </View>
                {cityCoords && (
                  <View style={styles.cityValidated}>
                    <Feather name="check-circle" size={14} color="#527A56" />
                    <Text style={styles.cityValidatedText}>{cityInput} — localisé</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.gpsLocate}
                  onPress={handleLocateMe}
                  disabled={cityLoading}
                  activeOpacity={0.7}
                >
                  <Feather name="map-pin" size={15} color="#527A56" />
                  <Text style={styles.gpsLocateText}>Utiliser ma position GPS</Text>
                  <Feather name="chevron-right" size={14} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Section: Notifications */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notifications</Text>
              <View style={styles.sectionCard}>
                {renderSettingRow({
                  icon: 'bell',
                  label: 'Notifications push',
                  description: 'Recevoir les notifications sur votre appareil',
                  value: notifPush,
                  onValueChange: setNotifPush,
                  accentColor: '#6B8F71',
                })}
                {renderSettingRow({
                  icon: 'camera',
                  label: 'Alertes de scans',
                  description: 'Résultats de vos scans de produits',
                  value: notifScans,
                  onValueChange: setNotifScans,
                  accentColor: '#527A56',
                })}
                {renderSettingRow({
                  icon: 'calendar',
                  label: 'Rappels de gardes',
                  description: 'Rappels pour vos réservations',
                  value: notifBookings,
                  onValueChange: setNotifBookings,
                  accentColor: '#C4956A',
                })}
                {renderSettingRow({
                  icon: 'message-circle',
                  label: 'Messages',
                  description: 'Nouveaux messages de pet-sitters',
                  value: notifMessages,
                  onValueChange: setNotifMessages,
                  accentColor: '#8CB092',
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
                      colors={['#527A56', '#6B8F71']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.aboutLogoGradient}
                    >
                      <PepeteIcon size={24} color="#FFF" />
                    </LinearGradient>
                  </View>
                  <View style={styles.aboutBrandInfo}>
                    <Text style={styles.aboutAppName}>Pépète</Text>
                    <Text style={styles.aboutTagline}>
                      Le compagnon de vos compagnons
                    </Text>
                  </View>
                </View>

                <View style={styles.aboutDivider} />

                {renderInfoRow({
                  icon: 'smartphone',
                  label: 'Version',
                  value: `v${APP_VERSION}`,
                })}
                {renderInfoRow({
                  icon: 'package',
                  label: 'Build',
                  value: 'Expo',
                })}
                {renderInfoRow({
                  icon: 'monitor',
                  label: 'Plateforme',
                  value: `${Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web'} ${Platform.Version || ''}`.trim(),
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
                  <Feather name="log-out" size={20} color={colors.error} />
                </View>
                <View style={styles.logoutInfo}>
                  <Text style={styles.logoutTitle}>Se déconnecter</Text>
                  <Text style={styles.logoutSubtitle}>
                    Déconnectez-vous de votre compte
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.error} style={{ opacity: 0.5 }} />
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerHeart}>
                Fait avec amour pour vos compagnons
              </Text>
              <Text style={styles.footerCopy}>
                Pépète v{APP_VERSION}
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
  accountAvatarWrap: {
    position: 'relative',
  },
  accountAvatar: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  accountAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  accountAvatarEditIcon: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#527A56',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
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
    backgroundColor: '#527A5615',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  sitterTagText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#527A56',
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
    backgroundColor: '#527A56',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Save Button
  saveButton: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginTop: SPACING.base,
    ...SHADOWS.glow('#527A56'),
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

  // Localisation section
  locCurrentCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  locCurrentCity: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: '#527A56',
  },
  locHint: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    marginBottom: SPACING.md,
    fontStyle: 'italic',
  },
  cityInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  cityTextInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md + 2,
    fontSize: FONT_SIZE.base,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  citySearchBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: '#527A56',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityValidated: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  cityValidatedText: {
    fontSize: FONT_SIZE.sm,
    color: '#527A56',
    fontWeight: '600',
  },
  gpsLocate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm + 2,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: SPACING.xs,
  },
  gpsLocateText: {
    fontSize: FONT_SIZE.sm,
    color: '#527A56',
    fontWeight: '600',
    flex: 1,
  },
});

export default SettingsScreen;
