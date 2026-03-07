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
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getMyPetsAPI } from '../../api/pets';
import { getScanHistoryAPI } from '../../api/products';
import { getMyBookingsAPI } from '../../api/petsitters';
import { FONTS, TEXT_STYLES } from '../../utils/typography';
const colors = require('../../utils/colors');
const { SHADOWS, RADIUS, SPACING, FONT_SIZE } = require('../../utils/colors');

const HEADER_PADDING_TOP = Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 20;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animated pressable menu item with scale micro-interaction
const PressableMenuItem = ({ item, onPress, index, parentFade, parentSlide }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const itemFade = useRef(new Animated.Value(0)).current;
  const itemSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const delay = 400 + index * 100;
    Animated.parallel([
      Animated.timing(itemFade, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(itemSlide, {
        toValue: 0,
        tension: 60,
        friction: 9,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 60,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: itemFade,
        transform: [{ translateY: itemSlide }, { scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        style={styles.menuCard}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <View style={[styles.menuIconContainer, { backgroundColor: item.bgColor }]}>
          <Text style={styles.menuIcon}>{item.icon}</Text>
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuLabel}>{item.label}</Text>
          <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
        </View>
        <View style={styles.menuArrowContainer}>
          <Text style={styles.menuArrow}>›</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  // Animations — staggered entry
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(50)).current;
  const heroScale = useRef(new Animated.Value(0.92)).current;
  const avatarScale = useRef(new Animated.Value(0)).current;
  const avatarRotate = useRef(new Animated.Value(0)).current;
  const statAnims = [0, 1, 2].map(() => ({
    fade: useRef(new Animated.Value(0)).current,
    slide: useRef(new Animated.Value(20)).current,
    scale: useRef(new Animated.Value(0.8)).current,
  }));
  const sectionFade = useRef(new Animated.Value(0)).current;
  const sectionSlide = useRef(new Animated.Value(40)).current;
  const logoutFade = useRef(new Animated.Value(0)).current;
  const logoutScale = useRef(new Animated.Value(1)).current;

  // Real data from API
  const [petsCount, setPetsCount] = useState(0);
  const [scansCount, setScansCount] = useState(0);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Stage 1: Hero area
    Animated.parallel([
      Animated.timing(heroFade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(heroSlide, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(heroScale, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Stage 2: Avatar pop-in
    Animated.sequence([
      Animated.delay(250),
      Animated.parallel([
        Animated.spring(avatarScale, {
          toValue: 1,
          tension: 60,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(avatarRotate, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Stage 3: Stat cards stagger
    statAnims.forEach((anim, i) => {
      Animated.sequence([
        Animated.delay(450 + i * 120),
        Animated.parallel([
          Animated.timing(anim.fade, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(anim.slide, {
            toValue: 0,
            tension: 60,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(anim.scale, {
            toValue: 1,
            tension: 50,
            friction: 6,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });

    // Stage 4: Menu sections
    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(sectionFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(sectionSlide, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Stage 5: Logout
    Animated.sequence([
      Animated.delay(900),
      Animated.timing(logoutFade, {
        toValue: 1,
        duration: 400,
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
    if (Platform.OS === 'web') {
      if (window.confirm('Voulez-vous vraiment vous deconnecter ?')) {
        logout();
      }
      return;
    }
    Alert.alert(
      'Deconnexion',
      'Voulez-vous vraiment vous deconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se deconnecter', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleLogoutPressIn = () => {
    Animated.spring(logoutScale, {
      toValue: 0.96,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleLogoutPressOut = () => {
    Animated.spring(logoutScale, {
      toValue: 1,
      tension: 60,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const stats = [
    { label: 'Animaux', value: petsCount, icon: '🐾', color: '#FF6B35' },
    { label: 'Scans', value: scansCount, icon: '📷', color: '#3B82F6' },
    { label: 'Gardes', value: bookingsCount, icon: '📅', color: '#10B981' },
  ];

  const menuSections = [
    {
      title: 'Mes compagnons',
      items: [
        {
          icon: '🐾',
          label: 'Mes animaux',
          subtitle: `${petsCount} compagnon${petsCount !== 1 ? 's' : ''} enregistre${petsCount !== 1 ? 's' : ''}`,
          screen: 'MyPets',
          accentColor: '#FF6B35',
          bgColor: colors.primarySoft,
        },
        {
          icon: '➕',
          label: 'Ajouter un animal',
          subtitle: 'Enregistrez un nouveau compagnon',
          screen: 'AddPet',
          accentColor: '#10B981',
          bgColor: colors.secondarySoft,
        },
      ],
    },
    {
      title: 'Parametres',
      items: [
        {
          icon: '⚙️',
          label: 'Reglages',
          subtitle: 'Compte, preferences, a propos',
          screen: 'Settings',
          accentColor: '#5B5BD6',
          bgColor: colors.accentSoft,
        },
      ],
    },
  ];

  const avatarSpin = avatarRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-8deg', '0deg'],
  });

  // Running item index across sections for stagger
  let globalItemIndex = 0;

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
        {/* Premium Hero Header with Deep Gradient */}
        <Animated.View
          style={{
            opacity: heroFade,
            transform: [{ translateY: heroSlide }, { scale: heroScale }],
          }}
        >
          <LinearGradient
            colors={['#FF6B35', '#FF7E45', '#FF9A60', '#FFB088']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.heroGradient}
          >
            {/* Premium decorative elements */}
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
            <View style={styles.decorCircle3} />
            <View style={styles.decorLine1} />
            <View style={styles.decorLine2} />

            <View style={styles.heroContent}>
              {/* Triple-ring Premium Avatar */}
              <Animated.View
                style={[
                  styles.avatarContainer,
                  {
                    transform: [
                      { scale: avatarScale },
                      { rotate: avatarSpin },
                    ],
                  },
                ]}
              >
                <View style={styles.avatarOuterGlow}>
                  <View style={styles.avatarOuterRing}>
                    <View style={styles.avatarMiddleRing}>
                      <View style={styles.avatarInnerRing}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarInitials}>{getInitials()}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
                {user?.isPetSitter && (
                  <View style={styles.sitterBadge}>
                    <Text style={styles.sitterBadgeIcon}>✓</Text>
                    <Text style={styles.sitterBadgeText}>Gardien</Text>
                  </View>
                )}
              </Animated.View>

              {/* User Info with premium typography */}
              <Text style={styles.userName}>{user?.name || 'Utilisateur'}</Text>
              <Text style={styles.userEmail}>{user?.email || ''}</Text>
              {user?.phone ? (
                <View style={styles.phoneBadge}>
                  <Text style={styles.phoneIcon}>📱</Text>
                  <Text style={styles.phoneText}>{user.phone}</Text>
                </View>
              ) : null}
            </View>

            {/* Glass-morphism Stat Cards */}
            <View style={styles.statsContainer}>
              {stats.map((stat, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.statCardWrapper,
                    {
                      opacity: statAnims[index].fade,
                      transform: [
                        { translateY: statAnims[index].slide },
                        { scale: statAnims[index].scale },
                      ],
                    },
                  ]}
                >
                  <View style={styles.statCard}>
                    <View style={styles.statGlassOverlay} />
                    <Text style={styles.statIcon}>{stat.icon}</Text>
                    {statsLoading ? (
                      <ActivityIndicator
                        size="small"
                        color="rgba(255,255,255,0.9)"
                        style={{ marginVertical: 4 }}
                      />
                    ) : (
                      <Text style={styles.statValue}>{stat.value}</Text>
                    )}
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Menu Sections with staggered items */}
        {menuSections.map((section, sectionIndex) => (
          <Animated.View
            key={sectionIndex}
            style={[
              styles.menuSection,
              sectionIndex === 0 && { marginTop: -SPACING.xs },
              {
                opacity: sectionFade,
                transform: [{ translateY: sectionSlide }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>{section.title}</Text>

            {section.items.map((item, itemIndex) => {
              const currentIndex = globalItemIndex++;
              return (
                <PressableMenuItem
                  key={itemIndex}
                  item={item}
                  index={currentIndex}
                  onPress={() => navigation.navigate(item.screen)}
                />
              );
            })}
          </Animated.View>
        ))}

        {/* Premium Logout Button */}
        <Animated.View
          style={[
            styles.logoutSection,
            {
              opacity: logoutFade,
              transform: [{ scale: logoutScale }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            onPressIn={handleLogoutPressIn}
            onPressOut={handleLogoutPressOut}
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel="Se deconnecter"
          >
            <View style={styles.logoutIconBg}>
              <Text style={styles.logoutIcon}>🚪</Text>
            </View>
            <Text style={styles.logoutText}>Se deconnecter</Text>
            <View style={styles.logoutChevronContainer}>
              <Text style={styles.logoutChevron}>›</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Premium App footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <View style={styles.footerBadge}>
            <Text style={styles.footerPaw}>🐾</Text>
            <Text style={styles.footerText}>patoune</Text>
          </View>
          <Text style={styles.footerVersion}>v2.0.0 — Le meilleur pour vos animaux</Text>
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

  // Hero Gradient — deeper, more premium
  heroGradient: {
    paddingTop: HEADER_PADDING_TOP,
    paddingBottom: SPACING['3xl'] + 8,
    borderBottomLeftRadius: RADIUS['3xl'] + 4,
    borderBottomRightRadius: RADIUS['3xl'] + 4,
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  decorCircle3: {
    position: 'absolute',
    top: 80,
    left: SCREEN_WIDTH * 0.6,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  decorLine1: {
    position: 'absolute',
    top: 40,
    left: 20,
    width: 60,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 1,
    transform: [{ rotate: '30deg' }],
  },
  decorLine2: {
    position: 'absolute',
    bottom: 60,
    right: 30,
    width: 40,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 1,
    transform: [{ rotate: '-20deg' }],
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl + 4,
  },

  // Premium Triple-ring Avatar
  avatarContainer: {
    alignItems: 'center',
    marginBottom: SPACING.base + 4,
  },
  avatarOuterGlow: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOuterRing: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiddleRing: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInnerRing: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: 'rgba(255, 255, 255, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  avatarInitials: {
    fontFamily: FONTS.brand,
    fontSize: FONT_SIZE['3xl'],
    color: '#FF6B35',
    letterSpacing: 1,
  },
  sitterBadge: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: SPACING.md + 2,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    gap: 5,
    ...SHADOWS.md,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  sitterBadgeIcon: {
    fontSize: 11,
    color: colors.white,
    fontWeight: '800',
  },
  sitterBadgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.xs,
    color: colors.white,
    letterSpacing: 0.5,
  },

  // User Info — premium typography
  userName: {
    fontFamily: FONTS.brand,
    fontSize: FONT_SIZE['2xl'] + 2,
    color: colors.white,
    marginBottom: SPACING.xs,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  userEmail: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.base,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm + 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  phoneIcon: {
    fontSize: 13,
  },
  phoneText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255, 255, 255, 0.95)',
  },

  // Glass-morphism Stats
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  statCardWrapper: {
    flex: 1,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: RADIUS.xl + 2,
    paddingVertical: SPACING.base + 4,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
  },
  statGlassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.xl + 2,
  },
  statIcon: {
    fontSize: 22,
    marginBottom: SPACING.xs + 2,
  },
  statValue: {
    fontFamily: FONTS.brand,
    fontSize: FONT_SIZE['2xl'],
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Menu Sections — more breathing room
  menuSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl + 4,
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
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: RADIUS.xl + 2,
    padding: SPACING.base + 2,
    marginBottom: SPACING.md + 2,
    ...SHADOWS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.02)',
  },
  menuIconContainer: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 24,
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: SPACING.base,
  },
  menuLabel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.base + 1,
    color: colors.text,
    marginBottom: 3,
  },
  menuSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
  },
  menuArrowContainer: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  menuArrow: {
    fontSize: 22,
    color: colors.textTertiary,
    fontWeight: '600',
    marginTop: -1,
  },

  // Premium Logout
  logoutSection: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl + 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: RADIUS.xl + 2,
    paddingVertical: SPACING.base + 2,
    paddingHorizontal: SPACING.base + 2,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.10)',
    ...SHADOWS.md,
  },
  logoutIconBg: {
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
  logoutText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.base,
    color: colors.error,
    flex: 1,
    marginLeft: SPACING.base,
  },
  logoutChevronContainer: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutChevron: {
    fontSize: 20,
    color: colors.error,
    fontWeight: '600',
    marginTop: -1,
    opacity: 0.6,
  },

  // Premium Footer
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl + 8,
    paddingVertical: SPACING.md,
  },
  footerDivider: {
    width: 40,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.borderLight,
    marginBottom: SPACING.lg,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  footerPaw: {
    fontSize: 18,
  },
  footerText: {
    fontFamily: FONTS.brand,
    fontSize: 20,
    color: colors.text,
    letterSpacing: 2,
    textTransform: 'lowercase',
  },
  footerVersion: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: colors.textLight,
  },

  bottomSpacer: {
    height: SPACING['2xl'],
  },
});

export default ProfileScreen;
