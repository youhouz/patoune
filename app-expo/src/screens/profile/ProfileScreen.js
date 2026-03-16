import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  Animated,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { PepeteIcon } from '../../components/PepeteLogo';
import { getMyPetsAPI } from '../../api/pets';
import { getScanHistoryAPI } from '../../api/products';
import { getMyBookingsAPI } from '../../api/petsitters';
import { uploadAvatarAPI } from '../../api/auth';
import { API_URL } from '../../api/client';
import { showAlert } from '../../utils/alert';
import colors, { SHADOWS, RADIUS, SPACING, FONT_SIZE } from '../../utils/colors';

const HEADER_PADDING_TOP = Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 20;

const ProfileScreen = ({ navigation }) => {
  const { user, logout, activeMode, switchMode } = useAuth();
  const canSwitch = user?.role === 'both' || user?.role === 'guardian';

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const heroScale = useRef(new Animated.Value(0.95)).current;

  // Real data from API
  const [petsCount, setPetsCount] = useState(0);
  const [scansCount, setScansCount] = useState(0);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(heroScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const [petsRes, scansRes, bookingsRes] = await Promise.allSettled([
        getMyPetsAPI(),
        getScanHistoryAPI(),
        getMyBookingsAPI(),
      ]);

      if (petsRes.status === 'fulfilled') {
        const pets = petsRes.value?.data?.pets || petsRes.value?.data || [];
        setPetsCount(Array.isArray(pets) ? pets.length : 0);
      }
      if (scansRes.status === 'fulfilled') {
        const scans = scansRes.value?.data?.history || scansRes.value?.data || [];
        setScansCount(Array.isArray(scans) ? scans.length : 0);
      }
      if (bookingsRes.status === 'fulfilled') {
        const bookings = bookingsRes.value?.data?.bookings || bookingsRes.value?.data || [];
        setBookingsCount(Array.isArray(bookings) ? bookings.length : 0);
      }
    } catch (err) {
      console.log('Erreur chargement stats profil:', err);
    } finally {
      setStatsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats();
  }, [loadStats]);

  // Build initials from user name (two letters max)
  const getInitials = () => {
    if (!user?.name) return '?';
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

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
    } catch (err) {
      console.log('Erreur upload avatar:', err);
      showAlert('Erreur', 'Impossible de mettre a jour la photo de profil.');
    } finally {
      setUploadingAvatar(false);
    }
  }, [updateUser]);

  const avatarUrl = user?.avatar
    ? (user.avatar.startsWith('http') ? user.avatar : `${API_URL.replace('/api', '')}${user.avatar}`)
    : null;

  const doLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.log('Erreur logout:', err);
    }
  };

  const handleLogout = () => {
    showAlert(
      'Deconnexion',
      'Voulez-vous vraiment vous deconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se deconnecter', style: 'destructive', onPress: doLogout },
      ]
    );
  };

  const stats = [
    { label: 'Animaux', value: petsCount, icon: 'heart', color: '#6B8F71' },
    { label: 'Scans', value: scansCount, icon: 'camera', color: '#527A56' },
    { label: 'Gardes', value: bookingsCount, icon: 'calendar', color: '#C4956A' },
  ];

  const ownerSections = [
    {
      title: 'Mes compagnons',
      items: [
        {
          icon: 'heart',
          label: 'Mes animaux',
          subtitle: `${petsCount} compagnon${petsCount !== 1 ? 's' : ''} enregistre${petsCount !== 1 ? 's' : ''}`,
          screen: 'MyPets',
          accentColor: '#6B8F71',
          bgColor: colors.primarySoft,
        },
        {
          icon: 'plus-circle',
          label: 'Ajouter un animal',
          subtitle: 'Enregistrez un nouveau compagnon',
          screen: 'AddPet',
          accentColor: '#527A56',
          bgColor: colors.secondarySoft,
        },
      ],
    },
  ];

  const sitterSections = [
    {
      title: 'Mon activite pet-sitter',
      items: [
        {
          icon: 'edit-3',
          label: 'Mon annonce',
          subtitle: 'Creer ou modifier mon profil pet-sitter',
          screen: 'PetSitterProfile',
          accentColor: '#527A56',
          bgColor: colors.primarySoft,
        },
        {
          icon: 'inbox',
          label: 'Mes reservations',
          subtitle: 'Voir les demandes des proprietaires',
          screen: 'PetSitterBookings',
          accentColor: '#C4956A',
          bgColor: colors.accentSoft,
        },
      ],
    },
  ];

  const menuSections = [
    ...(activeMode === 'petsitter' ? sitterSections : ownerSections),
    {
      title: 'Parametres',
      items: [
        {
          icon: 'settings',
          label: 'Reglages',
          subtitle: 'Compte, preferences, a propos',
          screen: 'Settings',
          accentColor: '#C4956A',
          bgColor: colors.accentSoft,
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.white}
            progressBackgroundColor={colors.primary}
          />
        }
      >
        {/* Hero Header with Gradient */}
        <LinearGradient
          colors={['#527A56', '#6B8F71', '#8CB092']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          {/* Decorative circles */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />

          <Animated.View
            style={[
              styles.heroContent,
              { transform: [{ scale: heroScale }] },
            ]}
          >
            {/* Double-ring Avatar */}
            <TouchableOpacity style={styles.avatarContainer} onPress={handlePickAvatar} activeOpacity={0.8} disabled={uploadingAvatar}>
              <View style={styles.avatarOuterRing}>
                <View style={styles.avatarInnerRing}>
                  <View style={styles.avatar}>
                    {uploadingAvatar ? (
                      <ActivityIndicator size="small" color="#6B8F71" />
                    ) : avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarInitials}>{getInitials()}</Text>
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.avatarEditBadge}>
                <Feather name="camera" size={12} color="#FFF" />
              </View>
              {user?.isPetSitter && (
                <View style={styles.sitterBadge}>
                  <Feather name="check" size={10} color="#FFF" />
                  <Text style={styles.sitterBadgeText}>Pet-sitter</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* User Info */}
            <Text style={styles.userName}>{user?.name || 'Utilisateur'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            {user?.phone ? (
              <View style={styles.phoneBadge}>
                <Feather name="phone" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.phoneText}>{user.phone}</Text>
              </View>
            ) : null}
            {/* Mode Switcher */}
            {canSwitch && (
              <View style={styles.modeSwitcher}>
                <TouchableOpacity
                  style={[styles.modeBtn, activeMode === 'owner' && styles.modeBtnActive]}
                  onPress={() => switchMode('owner')}
                  activeOpacity={0.7}
                >
                  <Feather name="heart" size={14} color={activeMode === 'owner' ? '#527A56' : 'rgba(255,255,255,0.7)'} />
                  <Text style={[styles.modeBtnText, activeMode === 'owner' && styles.modeBtnTextActive]}>Proprietaire</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeBtn, activeMode === 'petsitter' && styles.modeBtnActive]}
                  onPress={() => switchMode('petsitter')}
                  activeOpacity={0.7}
                >
                  <Feather name="shield" size={14} color={activeMode === 'petsitter' ? '#527A56' : 'rgba(255,255,255,0.7)'} />
                  <Text style={[styles.modeBtnText, activeMode === 'petsitter' && styles.modeBtnTextActive]}>Pet-sitter</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Feather name={stat.icon} size={20} color="rgba(255,255,255,0.9)" style={{ marginBottom: SPACING.xs }} />
                {statsLoading ? (
                  <ActivityIndicator
                    size="small"
                    color="rgba(255,255,255,0.8)"
                    style={{ marginVertical: 2 }}
                  />
                ) : (
                  <Text style={styles.statValue}>{stat.value}</Text>
                )}
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <Animated.View
            key={sectionIndex}
            style={[
              styles.menuSection,
              sectionIndex === 0 && { marginTop: -SPACING.xs },
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>{section.title}</Text>

            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.menuCard}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.6}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: item.bgColor }]}>
                  <Feather name={item.icon} size={22} color={item.accentColor} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <View style={styles.menuArrowContainer}>
                  <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        ))}

        {/* Logout Button */}
        <Animated.View
          style={[
            styles.logoutSection,
            { opacity: fadeAnim },
          ]}
        >
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.6}
          >
            <Feather name="log-out" size={18} color={colors.error} style={{ marginRight: SPACING.sm }} />
            <Text style={styles.logoutText}>Se deconnecter</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* App footer */}
        <View style={styles.footer}>
          <View style={styles.footerBadge}>
            <PepeteIcon size={16} color={colors.primary} />
            <Text style={styles.footerText}>pepete.</Text>
          </View>
          <Text style={styles.footerVersion}>v1.0.0 — Le meilleur pour vos animaux</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING['2xl'],
  },

  // Hero Gradient
  heroGradient: {
    paddingTop: HEADER_PADDING_TOP,
    paddingBottom: SPACING['3xl'],
    borderBottomLeftRadius: RADIUS['3xl'],
    borderBottomRightRadius: RADIUS['3xl'],
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },

  // Double-ring Avatar
  avatarContainer: {
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  avatarOuterRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInnerRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarInitials: {
    fontSize: FONT_SIZE['3xl'],
    fontWeight: '800',
    color: '#6B8F71',
    letterSpacing: 1,
  },
  avatarEditBadge: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#527A56',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    ...SHADOWS.sm,
  },
  sitterBadge: {
    position: 'absolute',
    bottom: -6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#527A56',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.full,
    gap: 4,
    ...SHADOWS.md,
  },
  sitterBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },

  // User Info
  userName: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '800',
    color: colors.white,
    marginBottom: SPACING.xs,
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: FONT_SIZE.base,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  phoneText: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },

  // Mode Switcher
  modeSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.full,
    padding: 3,
    marginTop: SPACING.base,
    gap: 2,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  modeBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  modeBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  modeBtnTextActive: {
    color: '#527A56',
    fontWeight: '700',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  statValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: colors.white,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.3,
  },

  // Menu Sections
  menuSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
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
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: SPACING.base,
  },
  menuLabel: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  menuArrowContainer: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Logout
  logoutSection: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorSoft,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.base,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.12)',
  },
  logoutText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: colors.error,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  footerText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'lowercase',
  },
  footerVersion: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '400',
  },

  bottomSpacer: {
    height: SPACING['2xl'],
  },
});

export default ProfileScreen;
