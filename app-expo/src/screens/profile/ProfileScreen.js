import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getMyPetsAPI } from '../../api/pets';
import { getScanHistoryAPI } from '../../api/products';
import { getMyBookingsAPI } from '../../api/petsitters';
import { FONTS } from '../../utils/typography';
const { COLORS, SHADOWS, RADIUS, SPACING, FONT_SIZE } = require('../../utils/colors');

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

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

  const handleLogout = () => {
    Alert.alert(
      'Deconnexion',
      'Etes-vous sur de vouloir vous deconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se deconnecter', style: 'destructive', onPress: logout },
      ]
    );
  };

  // Role badge helper
  const getRoleBadge = () => {
    const role = user?.role;
    if (role === 'guardian') return { label: 'Gardien', color: COLORS.secondary };
    if (role === 'both') return { label: 'Gardien & Proprio', color: COLORS.accent };
    return null;
  };

  const stats = [
    { label: 'Animaux', value: petsCount, icon: 'heart', color: COLORS.primary },
    { label: 'Scans', value: scansCount, icon: 'camera', color: COLORS.secondary },
    { label: 'Gardes', value: bookingsCount, icon: 'calendar', color: COLORS.accent },
  ];

  const menuSections = [
    {
      title: 'Mes compagnons',
      items: [
        {
          icon: 'heart',
          label: 'Mes animaux',
          subtitle: `${petsCount} compagnon${petsCount !== 1 ? 's' : ''} enregistre${petsCount !== 1 ? 's' : ''}`,
          screen: 'MyPets',
          accentColor: COLORS.primary,
          bgColor: COLORS.primarySoft,
        },
        {
          icon: 'plus',
          label: 'Ajouter un animal',
          subtitle: 'Enregistrez un nouveau compagnon',
          screen: 'AddPet',
          accentColor: COLORS.success,
          bgColor: COLORS.secondarySoft,
        },
      ],
    },
    {
      title: 'Parametres',
      items: [
        {
          icon: 'settings',
          label: 'Reglages',
          subtitle: 'Compte, preferences, a propos',
          screen: 'Settings',
          accentColor: COLORS.accent,
          bgColor: COLORS.accentSoft,
        },
      ],
    },
  ];

  const roleBadge = getRoleBadge();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.white}
            progressBackgroundColor={COLORS.primary}
          />
        }
      >
        {/* Hero Header with Gradient */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight, '#E8A98D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroGradient, { paddingTop: insets.top + 20 }]}
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
            <View style={styles.avatarContainer}>
              <View style={styles.avatarOuterRing}>
                <View style={styles.avatarInnerRing}>
                  <View style={styles.avatar}>
                    {user?.avatar ? (
                      <Image source={{ uri: user.avatar }} style={[styles.avatar, { overflow: 'hidden' }]} />
                    ) : (
                      <Text style={styles.avatarInitials}>{getInitials()}</Text>
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.badgeRow}>
                {user?.isPetSitter && (
                  <View style={styles.sitterBadge}>
                    <Feather name="check" size={10} color={COLORS.white} />
                    <Text style={styles.sitterBadgeText}>Gardien</Text>
                  </View>
                )}
                {roleBadge && (
                  <View style={[styles.roleBadge, { backgroundColor: roleBadge.color }]}>
                    <Text style={styles.roleBadgeText}>{roleBadge.label}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* User Info */}
            <Text style={styles.userName}>{user?.name || 'Utilisateur'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            {user?.phone ? (
              <View style={styles.phoneBadge}>
                <Feather name="smartphone" size={12} color="rgba(255, 255, 255, 0.9)" />
                <Text style={styles.phoneText}>{user.phone}</Text>
              </View>
            ) : null}
          </Animated.View>

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Feather name={stat.icon} size={20} color={COLORS.white} style={{ marginBottom: SPACING.xs }} />
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
                  <Feather name="chevron-right" size={18} color={COLORS.pebble} />
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
            <Feather name="log-out" size={18} color={COLORS.error} style={{ marginRight: SPACING.sm }} />
            <Text style={styles.logoutText}>Se deconnecter</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* App footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Patoune v2.0.0</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING['2xl'],
  },

  // Hero Gradient
  heroGradient: {
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
  avatarInitials: {
    fontSize: FONT_SIZE['3xl'],
    fontFamily: FONTS.heading,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  badgeRow: {
    position: 'absolute',
    bottom: -6,
    flexDirection: 'row',
    gap: 6,
  },
  sitterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.full,
    gap: 4,
    ...SHADOWS.md,
  },
  sitterBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.full,
    ...SHADOWS.md,
  },
  roleBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  // User Info
  userName: {
    fontSize: FONT_SIZE['2xl'],
    fontFamily: FONTS.heading,
    color: COLORS.white,
    marginBottom: SPACING.xs,
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.body,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  phoneText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodyMedium,
    color: 'rgba(255, 255, 255, 0.9)',
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
    fontFamily: FONTS.heading,
    color: COLORS.white,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodySemiBold,
    color: 'rgba(255, 255, 255, 0.8)',
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
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.stone,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
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
    fontFamily: FONTS.heading,
    color: COLORS.charcoal,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.body,
    color: COLORS.stone,
  },
  menuArrowContainer: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.linen,
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
    backgroundColor: COLORS.errorSoft,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.base,
    borderWidth: 1,
    borderColor: 'rgba(199, 80, 80, 0.12)',
  },
  logoutText: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.heading,
    color: COLORS.error,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.sand,
  },

  bottomSpacer: {
    height: SPACING['2xl'],
  },
});

export default ProfileScreen;
