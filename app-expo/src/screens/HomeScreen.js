import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput,
  Platform, StatusBar, Dimensions, RefreshControl, Animated, Image, Modal, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getMyPetsAPI } from '../api/pets';
import { getScanHistoryAPI } from '../api/products';
import { getMyBookingsAPI } from '../api/petsitters';
import { FONTS } from '../utils/typography';
const { COLORS, SPACING, RADIUS, SHADOWS, FONT_SIZE, getScoreColor, getScoreLabel } = require('../utils/colors');

const { width } = Dimensions.get('window');
const CARD_GAP = 14;
const CARD_WIDTH = (width - SPACING.xl * 2 - CARD_GAP) / 2;

// ─── Animated wrapper with staggered fade-in ────────────────
const AnimatedSection = ({ delay = 0, children, style }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 500, delay, useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 450, delay, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {children}
    </Animated.View>
  );
};

// ─── Pressable card with scale micro-interaction ─────────────
const PressableCard = ({ onPress, style, children, wrapStyle }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.96, friction: 8, tension: 100, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start()}
      activeOpacity={0.92}
      style={wrapStyle}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Feature Card (2x2 grid) ────────────────────────────────
const FeatureCard = ({ icon, title, subtitle, bgColor, textColor, iconBg, onPress }) => (
  <PressableCard onPress={onPress} wrapStyle={{ flex: 1 }} style={[s.featureCard, { backgroundColor: bgColor }]}>  
    <View style={[s.featureIconWrap, { backgroundColor: iconBg }]}>
      <Text style={s.featureIcon}>{icon}</Text>
    </View>
    <Text style={[s.featureTitle, { color: textColor }]}>{title}</Text>
    <Text style={[s.featureSubtitle, { color: textColor + 'AA' }]}>{subtitle}</Text>
  </PressableCard>
);

// ─── News card ───────────────────────────────────────────────
const NewsCard = ({ title, category, image, color, onPress }) => (
  <PressableCard onPress={onPress}>
    <View style={s.newsCard}>
      <View style={[s.newsImagePlaceholder, { backgroundColor: color + '20' }]}>
        <Text style={{ fontSize: 40 }}>{image}</Text>
      </View>
      <View style={s.newsContent}>
        <View style={[s.newsCategoryBadge, { backgroundColor: color + '18' }]}>
          <Text style={[s.newsCategoryText, { color }]}>{category}</Text>
        </View>
        <Text style={s.newsTitle} numberOfLines={2}>{title}</Text>
      </View>
    </View>
  </PressableCard>
);

// ─── Pet Avatar ──────────────────────────────────────────────
const PetAvatar = ({ pet, size = 52 }) => {
  const speciesEmojis = { chien: '🐕', chat: '🐈', oiseau: '🦜', rongeur: '🐹', reptile: '🦎', poisson: '🐟' };
  return (
    <View style={[s.petAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ fontSize: size * 0.45 }}>{speciesEmojis[pet.species] || '🐾'}</Text>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [petsRes, scansRes, bookingsRes] = await Promise.allSettled([
        getMyPetsAPI(), getScanHistoryAPI(), getMyBookingsAPI(),
      ]);
      if (petsRes.status === 'fulfilled') setPets(petsRes.value.data?.pets || petsRes.value.data || []);
      if (scansRes.status === 'fulfilled') setRecentScans((scansRes.value.data?.history || scansRes.value.data || []).slice(0, 5));
      if (bookingsRes.status === 'fulfilled') {
        const all = bookingsRes.value.data?.bookings || bookingsRes.value.data || [];
        setBookings(all.filter(b => b.status === 'confirmed' || b.status === 'pending').sort((a, b) => new Date(a.startDate) - new Date(b.startDate)));
      }
    } catch (err) {
      console.log('Home fetch error:', err.message);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const hour = new Date().getHours();
  const greetText = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const firstName = user?.name?.split(' ')[0] || '';

  // ── News data ──
  const newsItems = [
    {
      title: '10 aliments dangereux pour votre chat',
      category: 'Nutrition',
      image: '🐱',
      color: '#E67E22',
      date: 'Aujourd\'hui',
      author: 'Dr. Martin',
      content: "Certains aliments que nous consommons tous les jours peuvent être extrêmement toxiques pour les chats.\n\nLe chocolat, particulièrement le chocolat noir, contient de la théobromine, qui peut provoquer des troubles cardiaques et nerveux.\n\nLes oignons et l'ail sont également dangereux car ils peuvent endommager les globules rouges. Attention aussi aux produits laitiers, car beaucoup de chats adultes sont intolérants au lactose.\n\nEn cas d'ingestion, contactez immédiatement votre clinique vétérinaire pour une prise en charge rapide."
    },
    {
      title: 'Comment choisir le bon pet-sitter ?',
      category: 'Garde',
      image: '🏡',
      color: COLORS.primary,
      date: 'Hier',
      author: 'Equipe Pépète',
      content: "Confier son animal n'est jamais une étape facile. Commencez par organiser une rencontre avant la garde pour voir comment le pet-sitter interagit avec votre compagnon.\n\nPosez des questions sur son expérience, demandez quelles sont ses procédures en cas d'urgence et s'il a l'habitude de gérer la race ou l'espèce de l'animal en question.\n\nSur Pépète, tenez compte de la certification et lisez toujours les avis des autres propriétaires pour vous assurer un départ serein."
    },
    {
      title: 'Les bienfaits du jeu pour les chiens',
      category: 'Bien-être',
      image: '🎾',
      color: '#4ECBA0',
      date: 'Il y a 3 jours',
      author: 'Sophie L.',
      content: "Le jeu ne sert pas qu'à divertir votre chien : c'est un élément fondamental de son équilibre physique et psychologique.\n\nDes jeux interactifs, comme la balle ou le cache-cache, stimulent ses capacités cognitives et renforcent votre lien affectif avec lui.\n\nIl est recommandé d'accorder au minimum 30 minutes de jeu par jour, en variant les exercices pour éviter l'ennui et réduire le stress ou l'anxiété de votre animal."
    },
  ];

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ── Header ── */}
        <AnimatedSection style={[s.header, { paddingTop: insets.top + 12 }]}>
          <View style={s.headerLeft}>
            <View style={s.headerLogoCircle}>
              <Text style={s.headerLogoEmoji}>🐾</Text>
            </View>
            <View>
              <Text style={s.headerBrand}>Pépète</Text>
              <Text style={s.headerGreeting}>{greetText}{firstName ? `, ${firstName}` : ''}</Text>
            </View>
          </View>
          {user ? (
            <TouchableOpacity style={s.avatarBtn} onPress={() => navigation.navigate('Profil')} activeOpacity={0.8}>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={s.avatarGradient}>
                <Text style={s.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
              </LinearGradient>
              <View style={s.notificationDot} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.signUpBtn} onPress={() => navigation.navigate('AuthStack', { screen: 'Register' })} activeOpacity={0.8}>
              <Text style={s.signUpBtnText}>S'inscrire</Text>
            </TouchableOpacity>
          )}
        </AnimatedSection>

        {/* ── Search bar ── */}
        <AnimatedSection delay={80} style={s.searchSection}>
          <TouchableOpacity style={s.searchBar} onPress={() => setSearchModalVisible(true)} activeOpacity={0.8}>
            <Text style={s.searchIcon}>🔍</Text>
            <Text style={s.searchPlaceholder}>Rechercher un produit, un gardien...</Text>
          </TouchableOpacity>
        </AnimatedSection>

        {/* ── Feature grid 2x2 ── */}
        <AnimatedSection delay={160} style={s.featuresSection}>
          <View style={s.featuresRow}>
            <FeatureCard
              icon="📷"
              title="Scanner Produit"
              subtitle="Analyser un aliment"
              bgColor={COLORS.primary}
              textColor="#FFFFFF"
              iconBg="rgba(255,255,255,0.22)"
              onPress={() => navigation.navigate('Scanner')}
            />
            <FeatureCard
              icon="🏡"
              title="Trouver un Gardien"
              subtitle="Près de chez vous"
              bgColor="#FFFFFF"
              textColor={COLORS.text}
              iconBg={COLORS.primarySoft}
              onPress={() => navigation.navigate('Garde')}
            />
          </View>
          <View style={s.featuresRow}>
            <FeatureCard
              icon="🤖"
              title="Question IA"
              subtitle="Poser une question"
              bgColor="#FFFFFF"
              textColor={COLORS.text}
              iconBg={COLORS.accentSoft}
              onPress={() => navigation.navigate('Assistant')}
            />
            <FeatureCard
              icon="🐾"
              title="Mes Animaux"
              subtitle={pets.length ? `${pets.length} compagnon${pets.length > 1 ? 's' : ''}` : 'Ajouter un animal'}
              bgColor={COLORS.secondary}
              textColor="#FFFFFF"
              iconBg="rgba(255,255,255,0.22)"
              onPress={() => navigation.navigate('Profil', { screen: 'MyPets' })}
            />
          </View>
          <View style={s.featuresRow}>
            <FeatureCard
              icon="⚕️"
              title="Vétérinaire"
              subtitle="Bientôt"
              bgColor="#F2F2F2"
              textColor="#909090"
              iconBg="#E6E6E6"
              onPress={() => Alert.alert('Bientôt disponible', 'Cette fonctionnalité sera bientôt disponible !')}
            />
            <FeatureCard
              icon="🛍️"
              title="Shopping"
              subtitle="Bientôt"
              bgColor="#F2F2F2"
              textColor="#909090"
              iconBg="#E6E6E6"
              onPress={() => Alert.alert('Bientôt disponible', 'La boutique arrive très prochainement !')}
            />
          </View>
        </AnimatedSection>

        {/* ── Mes compagnons (if pets) ── */}
        {pets.length > 0 && (
          <AnimatedSection delay={240} style={s.petsSection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Mes compagnons</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Profil', { screen: 'MyPets' })} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={s.seeAll}>Voir tout →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.petsScroll}>
              {pets.map((pet, idx) => (
                <View key={pet._id || idx} style={s.petChip}>
                  <PetAvatar pet={pet} size={44} />
                  <Text style={s.petChipName}>{pet.name}</Text>
                </View>
              ))}
              <TouchableOpacity style={s.petAddChip} onPress={() => navigation.navigate('Profil', { screen: 'AddPet' })}>
                <View style={s.petAddCircle}><Text style={s.petAddIcon}>+</Text></View>
                <Text style={s.petAddLabel}>Ajouter</Text>
              </TouchableOpacity>
            </ScrollView>
          </AnimatedSection>
        )}

        {/* ── Prochaine garde ── */}
        {bookings.length > 0 && (
          <AnimatedSection delay={320} style={s.bookingSection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Prochaine garde</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Garde')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={s.seeAll}>Voir tout →</Text>
              </TouchableOpacity>
            </View>
            <View style={s.bookingCard}>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.bookingGradient}>
                <View style={s.bookingRow}>
                  <View>
                    <Text style={s.bookingService}>
                      {{ garde_domicile: 'Garde à domicile', garde_chez_sitter: 'Chez le gardien', promenade: 'Promenade', visite: 'Visite', toilettage: 'Toilettage' }[bookings[0].service] || bookings[0].service}
                    </Text>
                    <Text style={s.bookingDate}>
                      {new Date(bookings[0].startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                    </Text>
                  </View>
                  <View style={s.bookingBadge}>
                    <Text style={s.bookingBadgeText}>
                      {Math.max(0, Math.ceil((new Date(bookings[0].startDate) - new Date()) / (1000 * 60 * 60 * 24)))} j
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </AnimatedSection>
        )}

        {/* ── Derniers scans ── */}
        {recentScans.length > 0 && (
          <AnimatedSection delay={400} style={s.scansSection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Derniers scans</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Scanner', { screen: 'ScanHistory' })} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={s.seeAll}>Voir tout →</Text>
              </TouchableOpacity>
            </View>
            {recentScans.slice(0, 3).map((scan, idx) => {
              const score = scan.product?.nutritionScore || 0;
              const color = getScoreColor(score);
              return (
                <PressableCard
                  key={scan._id || idx}
                  style={s.scanCard}
                  onPress={() => navigation.navigate('Scanner', { screen: 'ProductResult', params: { product: scan.product } })}
                >
                  <View style={[s.scanScoreBadge, { backgroundColor: color + '15' }]}>
                    <Text style={[s.scanScoreText, { color }]}>{score}</Text>
                  </View>
                  <View style={s.scanInfo}>
                    <Text style={s.scanName} numberOfLines={1}>{scan.product?.name || 'Produit'}</Text>
                    <Text style={s.scanBrand} numberOfLines={1}>{scan.product?.brand || ''}</Text>
                  </View>
                  <View style={[s.scanLabel, { backgroundColor: color + '12' }]}>
                    <Text style={[s.scanLabelText, { color }]}>{getScoreLabel(score)}</Text>
                  </View>
                </PressableCard>
              );
            })}
          </AnimatedSection>
        )}

        {/* ── Actualités pour vous ── */}
        <AnimatedSection delay={480} style={s.newsSection}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Actualités pour vous</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.newsScroll}>
            {newsItems.map((item, idx) => (
              <NewsCard key={idx} {...item} onPress={() => setSelectedNews(item)} />
            ))}
          </ScrollView>
        </AnimatedSection>

        {/* ── AI Banner ── */}
        <AnimatedSection delay={560} style={s.bannerSection}>
          <PressableCard onPress={() => navigation.navigate('Assistant')} style={s.bannerCard}>
            <LinearGradient colors={[COLORS.accent, COLORS.accentLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.bannerGradient}>
              <View style={s.bannerRow}>
                <View style={s.bannerIconCircle}>
                  <Text style={{ fontSize: 26 }}>🤖</Text>
                </View>
                <View style={s.bannerTextWrap}>
                  <Text style={s.bannerTitle}>Une question ?</Text>
                  <Text style={s.bannerText}>Notre assistant IA répond instantanément</Text>
                </View>
                <Text style={s.bannerArrow}>→</Text>
              </View>
            </LinearGradient>
          </PressableCard>
        </AnimatedSection>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── News Reader Modal ── */}
      <Modal visible={!!selectedNews} animationType="slide" transparent={false} onRequestClose={() => setSelectedNews(null)}>
        <View style={s.newsModalContainer}>
          {/* Header image with gradient overlay */}
          <View style={[s.newsModalHeader, { backgroundColor: selectedNews?.color + '20' }]}>
            <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent']} style={StyleSheet.absoluteFill} />
            <Text style={{ fontSize: 90, alignSelf: 'center', marginTop: 40 }}>{selectedNews?.image}</Text>
            
            <TouchableOpacity style={[s.newsModalClose, { top: insets.top + 10 }]} onPress={() => setSelectedNews(null)}>
              <Text style={s.newsModalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Draggable-like content area */}
          <View style={s.newsModalContentWrap}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.newsModalScroll}>
              <View style={s.newsModalBadgeRow}>
                <View style={[s.newsCategoryBadge, { backgroundColor: selectedNews?.color + '20' }]}>
                  <Text style={[s.newsCategoryText, { color: selectedNews?.color }]}>{selectedNews?.category}</Text>
                </View>
                <Text style={s.newsModalDate}>{selectedNews?.date}</Text>
              </View>

              <Text style={s.newsModalTitle}>{selectedNews?.title}</Text>
              
              <View style={s.newsModalAuthorRow}>
                <View style={s.newsModalAuthorBadge}><Text>✍️</Text></View>
                <Text style={s.newsModalAuthorName}>{selectedNews?.author}</Text>
              </View>

              <Text style={s.newsModalBody}>{selectedNews?.content}</Text>
              <View style={{ height: 60 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Global Search Modal ── */}
      <Modal visible={searchModalVisible} animationType="fade" transparent={false} onRequestClose={() => setSearchModalVisible(false)}>
        <View style={[s.searchModalContainer, { paddingTop: insets.top + 10 }]}>
          <View style={s.searchModalHeader}>
            <TouchableOpacity onPress={() => setSearchModalVisible(false)} style={s.searchModalBack}>
              <Text style={{ fontSize: 24, color: COLORS.text }}>←</Text>
            </TouchableOpacity>
            <View style={s.searchModalInputWrap}>
              <Text style={s.searchIcon}>🔍</Text>
              <TextInput
                style={s.searchModalInput}
                placeholder="Rechercher sur Pépète..."
                autoFocus={true}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={COLORS.textTertiary}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={{ fontSize: 18, color: COLORS.textLight }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <ScrollView contentContainerStyle={s.searchModalBody} keyboardShouldPersistTaps="handled">
            <Text style={s.searchSectionTitle}>Suggestions rapides</Text>
            <TouchableOpacity style={s.searchSuggestion} onPress={() => { setSearchModalVisible(false); navigation.navigate('Scanner'); }}>
              <Text style={s.searchSuggestionEmoji}>📷</Text>
              <Text style={s.searchSuggestionText}>Scanner un produit</Text>
              <Text style={s.searchSuggestionArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.searchSuggestion} onPress={() => { setSearchModalVisible(false); navigation.navigate('Garde'); }}>
              <Text style={s.searchSuggestionEmoji}>🏡</Text>
              <Text style={s.searchSuggestionText}>Trouver un pet-sitter</Text>
              <Text style={s.searchSuggestionArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.searchSuggestion} onPress={() => { setSearchModalVisible(false); navigation.navigate('Assistant'); }}>
              <Text style={s.searchSuggestionEmoji}>🤖</Text>
              <Text style={s.searchSuggestionText}>Poser une question à l'IA</Text>
              <Text style={s.searchSuggestionArrow}>→</Text>
            </TouchableOpacity>

            {searchQuery.length > 2 && (
               <View style={s.searchModalPlaceholder}>
                 <Text style={s.searchModalPlaceholderEmoji}>🚧</Text>
                 <Text style={s.searchModalPlaceholderText}>Recherche globale de contenus bientôt disponible ! (Résultats pour "{searchQuery}")</Text>
               </View>
            )}
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 24 },

  // ── Header ──
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, // dynamic insets applied in component
    paddingHorizontal: SPACING.xl,
    paddingBottom: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerLogoCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  headerLogoEmoji: { fontSize: 22 },
  headerBrand: {
    fontFamily: FONTS.brand,
    fontSize: 24,
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  headerGreeting: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  avatarBtn: { position: 'relative' },
  avatarGradient: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.heading,
    fontSize: 18, color: '#FFF',
  },
  notificationDot: {
    position: 'absolute', top: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#E74C3C',
    borderWidth: 2, borderColor: COLORS.background,
  },
  signUpBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  signUpBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.sm, color: '#FFF',
  },

  // ── Search ──
  searchSection: { paddingHorizontal: SPACING.xl, marginTop: 12 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl, paddingHorizontal: 18, height: 52,
    borderWidth: 1, borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  searchIcon: { fontSize: 16, marginRight: 12 },
  searchPlaceholder: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.sm,
    color: COLORS.placeholder,
  },

  // ── Section header ──
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  seeAll: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
  },

  // ── Features 2x2 ──
  featuresSection: { paddingHorizontal: SPACING.xl, marginTop: 20 },
  featuresRow: { flexDirection: 'row', gap: CARD_GAP, marginBottom: CARD_GAP, alignItems: 'stretch' },
  featureCard: {
    flex: 1,
    borderRadius: RADIUS['2xl'],
    padding: 16,
    minHeight: 140,
    justifyContent: 'flex-end',
    ...SHADOWS.md,
  },
  featureIconWrap: {
    width: 44, height: 44, borderRadius: RADIUS.lg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  featureIcon: { fontSize: 24 },
  featureTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.md,
    marginBottom: 4,
  },
  featureSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.xs,
  },

  // ── Pets ──
  petsSection: { paddingHorizontal: SPACING.xl, marginTop: 20 },
  petsScroll: { gap: 12, paddingRight: SPACING.xl },
  petChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingRight: 18, paddingLeft: 4, paddingVertical: 4,
    borderWidth: 1, borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  petAvatar: {
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  petChipName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    marginLeft: 10,
  },
  petAddChip: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: RADIUS.full,
    paddingRight: 18, paddingLeft: 4, paddingVertical: 4,
    borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed',
  },
  petAddCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  petAddIcon: { fontSize: 22, color: COLORS.textTertiary },
  petAddLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    marginLeft: 8,
  },

  // ── Booking ──
  bookingSection: { paddingHorizontal: SPACING.xl, marginTop: 20 },
  bookingCard: {
    borderRadius: RADIUS['2xl'], overflow: 'hidden',
    ...SHADOWS.md,
  },
  bookingGradient: { padding: 20, borderRadius: RADIUS['2xl'] },
  bookingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  bookingService: {
    fontFamily: FONTS.heading,
    color: '#FFF', fontSize: FONT_SIZE.md,
  },
  bookingDate: {
    fontFamily: FONTS.body,
    color: 'rgba(255,255,255,0.85)', fontSize: FONT_SIZE.sm,
    marginTop: 4,
  },
  bookingBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 8,
  },
  bookingBadgeText: {
    fontFamily: FONTS.heading,
    color: '#FFF', fontSize: FONT_SIZE.md,
  },

  // ── Scans ──
  scansSection: { paddingHorizontal: SPACING.xl, marginTop: 20 },
  scanCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  scanScoreBadge: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  scanScoreText: { fontFamily: FONTS.heading, fontSize: FONT_SIZE.md },
  scanInfo: { flex: 1, marginRight: 10 },
  scanName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.sm, color: COLORS.text,
  },
  scanBrand: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.xs, color: COLORS.textSecondary,
    marginTop: 2,
  },
  scanLabel: { borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5 },
  scanLabelText: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZE.xs },

  // ── News ──
  newsSection: { paddingHorizontal: SPACING.xl, marginTop: 20 },
  newsScroll: { gap: 14 },
  newsCard: {
    width: 220,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  newsImagePlaceholder: {
    height: 120, alignItems: 'center', justifyContent: 'center',
  },
  newsContent: { padding: 14 },
  newsCategoryBadge: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 8,
  },
  newsCategoryText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.xs - 1,
  },
  newsTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    lineHeight: 20,
  },

  // ── Banner ──
  bannerSection: { paddingHorizontal: SPACING.xl, marginTop: 20 },
  bannerCard: {},
  bannerGradient: {
    borderRadius: RADIUS['2xl'], padding: 20,
    ...SHADOWS.md,
  },
  bannerRow: { flexDirection: 'row', alignItems: 'center' },
  bannerIconCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  bannerTextWrap: { flex: 1, marginLeft: 16 },
  bannerTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.md, color: '#FFF',
  },
  bannerText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.xs, color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  bannerArrow: {
    fontFamily: FONTS.heading,
    fontSize: 22, color: '#FFF', marginLeft: 8,
  },

  // ── News Modal ──
  newsModalContainer: { flex: 1, backgroundColor: '#FFF' },
  newsModalHeader: { height: 260, justifyContent: 'center', alignItems: 'center' },
  newsModalClose: {
    position: 'absolute', right: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center'
  },
  newsModalCloseText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  newsModalContentWrap: {
    flex: 1, backgroundColor: '#FFF',
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    marginTop: -30, paddingTop: 24, paddingHorizontal: SPACING.xl,
  },
  newsModalScroll: { paddingBottom: 40 },
  newsModalBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  newsModalDate: { color: COLORS.textSecondary, fontFamily: FONTS.body, fontSize: 13 },
  newsModalTitle: { fontFamily: FONTS.brand, fontSize: 26, color: COLORS.text, marginBottom: 16, lineHeight: 32 },
  newsModalAuthorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  newsModalAuthorBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F4F4', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  newsModalAuthorName: { fontFamily: FONTS.heading, fontSize: 15, color: COLORS.textSecondary },
  newsModalBody: { fontFamily: FONTS.body, fontSize: 16, color: COLORS.text, lineHeight: 26 },

  // ── Search Modal ──
  searchModalContainer: { flex: 1, backgroundColor: COLORS.background },
  searchModalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  searchModalBack: { marginRight: 16 },
  searchModalInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: RADIUS.lg, paddingHorizontal: 16, height: 48, ...SHADOWS.sm },
  searchModalInput: { flex: 1, fontFamily: FONTS.body, fontSize: 16, color: COLORS.text },
  searchModalBody: { padding: SPACING.xl },
  searchSectionTitle: { fontFamily: FONTS.heading, fontSize: 16, color: COLORS.textSecondary, marginBottom: 16 },
  searchSuggestion: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: RADIUS.lg, marginBottom: 12, ...SHADOWS.sm },
  searchSuggestionEmoji: { fontSize: 22, marginRight: 16 },
  searchSuggestionText: { flex: 1, fontFamily: FONTS.bodySemiBold, fontSize: 16, color: COLORS.text },
  searchSuggestionArrow: { fontFamily: FONTS.heading, fontSize: 18, color: COLORS.textLight },
  searchModalPlaceholder: { alignItems: 'center', marginTop: 40, padding: 20 },
  searchModalPlaceholderEmoji: { fontSize: 40, marginBottom: 12 },
  searchModalPlaceholderText: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },

});

export default HomeScreen;
