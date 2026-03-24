import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, StatusBar, RefreshControl, TextInput, Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// ─── Animated Pressable Card ─────────────────────────────
const PressableCard = ({ onPress, disabled, style, children }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 6 }).start();
  };
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
      activeOpacity={1}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getMyPetsAPI } from '../api/pets';
import { getScanHistoryAPI, getPopularProductsAPI } from '../api/products';
import { getMyBookingsAPI } from '../api/petsitters';
import { searchGlobalAPI } from '../api/search';
import { PawIcon } from '../components/Logo';
import useResponsive from '../hooks/useResponsive';
import usePWAInstall from '../hooks/usePWAInstall';
const { COLORS, SPACING, RADIUS, SHADOWS, FONT_SIZE, getScoreColor, getScoreLabel } = require('../utils/colors');

// ─── Recent Scan Card — Glass morphism ─────────────────────
const RecentScanCard = ({ scan, onPress }) => {
  const score = scan.product?.nutritionScore || 0;
  const color = getScoreColor(score);
  return (
    <TouchableOpacity style={s.scanCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.scanScoreBadge, { backgroundColor: color + '14' }]}>
        <Text style={[s.scanScoreText, { color }]}>{score}</Text>
        <Text style={[s.scanScoreMax, { color: color + '80' }]}>/100</Text>
      </View>
      <View style={s.scanInfo}>
        <Text style={s.scanName} numberOfLines={1}>{scan.product?.name || 'Produit'}</Text>
        <Text style={s.scanBrand} numberOfLines={1}>{scan.product?.brand || ''}</Text>
      </View>
      <View style={[s.scanLabel, { backgroundColor: color + '12' }]}>
        <Text style={[s.scanLabelText, { color }]}>{getScoreLabel(score)}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Next Booking Card — Premium gradient ──────────────────
const NextBookingCard = ({ booking }) => {
  if (!booking) return null;
  const start = new Date(booking.startDate);
  const daysUntil = Math.ceil((start - new Date()) / (1000 * 60 * 60 * 24));
  const dayLabel = daysUntil <= 0 ? "Aujourd'hui" : daysUntil === 1 ? 'Demain' : `Dans ${daysUntil}j`;
  const serviceLabels = {
    garde_domicile: 'Garde à domicile',
    garde_chez_sitter: 'Chez le pet-sitter',
    promenade: 'Promenade',
    visite: 'Visite à domicile',
    toilettage: 'Toilettage',
  };
  return (
    <View style={s.bookingCard}>
      <LinearGradient
        colors={['#527A56', '#6B8F71']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.bookingGradient}
      >
        <View style={s.bookingTop}>
          <View style={s.bookingBadge}>
            <Feather name="clock" size={12} color="#FFF" style={{ marginRight: 5 }} />
            <Text style={s.bookingBadgeText}>{dayLabel}</Text>
          </View>
          <Text style={s.bookingPrice}>{booking.totalPrice} €</Text>
        </View>
        <Text style={s.bookingService}>{serviceLabels[booking.service] || booking.service}</Text>
        <View style={s.bookingMeta}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="calendar" size={13} color="rgba(255,255,255,0.85)" />
            <Text style={s.bookingMetaText}>
              {start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <View style={s.bookingStatusBadge}>
            <Text style={s.bookingStatusText}>
              {booking.status === 'confirmed' ? 'Confirmé' : 'En attente'}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

// ─── Pet Mini Card — Refined ───────────────────────────────
const PetMiniCard = ({ pet }) => {
  const speciesLetters = { chien: 'C', chat: 'Ch', oiseau: 'O', rongeur: 'R', reptile: 'Re', poisson: 'P' };
  const speciesColors = { chien: '#6B8F71', chat: '#527A56', oiseau: '#8CB092', rongeur: '#C4956A', reptile: '#3D5E41', poisson: '#B8A88A' };
  const color = speciesColors[pet.species] || COLORS.primary;
  return (
    <View style={s.petMini}>
      <View style={[s.petMiniAvatar, { backgroundColor: color + '10', borderColor: color + '20' }]}>
        <Text style={[s.petMiniLetter, { color }]}>{speciesLetters[pet.species] || '?'}</Text>
      </View>
      <Text style={s.petMiniName} numberOfLines={1}>{pet.name}</Text>
    </View>
  );
};
// ─── Popular Product Card ─────────────────────────────────
const ANIMAL_EMOJI = { chien: '🐶', chat: '🐱', rongeur: '🐹', oiseau: '🐦', reptile: '🦎', poisson: '🐟', tous: '🐾' };

const PopularProductCard = ({ product, onPress }) => {
  const score = product.nutritionScore ?? 0;
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const animals = (product.targetAnimal || []).slice(0, 2).map(a => ANIMAL_EMOJI[a] || '🐾').join(' ');
  const pct = Math.max(4, score);  // barre min 4% pour être visible
  return (
    <TouchableOpacity style={s.popCard} onPress={onPress} activeOpacity={0.78}>
      {/* Score badge en haut à droite */}
      <View style={[s.popScoreBadge, { backgroundColor: color + '18' }]}>
        <Text style={[s.popScoreNum, { color }]}>{score}</Text>
        <Text style={[s.popScoreMax, { color: color + '90' }]}>/100</Text>
      </View>

      {/* Contenu */}
      <View style={s.popBody}>
        <Text style={s.popAnimal}>{animals || '🐾'}</Text>
        <Text style={s.popName} numberOfLines={2}>{product.name}</Text>
        <Text style={s.popBrand} numberOfLines={1}>{product.brand || 'Marque inconnue'}</Text>
      </View>

      {/* Barre de score */}
      <View style={s.popBarTrack}>
        <View style={[s.popBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <View style={s.popBarRow}>
        <Text style={[s.popLabel, { color }]}>{label}</Text>
        {product.scanCount > 0 && (
          <View style={s.popScanBadge}>
            <Feather name="maximize" size={10} color={COLORS.textTertiary} />
            <Text style={s.popScanCount}>{product.scanCount}x</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
// ═══════════════════════════════════════════════════════════
const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { isTablet, hPadding, contentWidth } = useResponsive();
  const [pets, setPets] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [popularProducts, setPopularProducts] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimer = useRef(null);

  const fetchData = async () => {
    try {
      const [petsRes, scansRes, bookingsRes] = await Promise.allSettled([
        getMyPetsAPI(),
        getScanHistoryAPI(),
        getMyBookingsAPI(),
      ]);
      if (petsRes.status === 'fulfilled') setPets(petsRes.value.data?.pets || petsRes.value.data || []);
      if (scansRes.status === 'fulfilled') setRecentScans((scansRes.value.data?.history || scansRes.value.data || []).slice(0, 5));
      if (bookingsRes.status === 'fulfilled') {
        const all = bookingsRes.value.data?.bookings || bookingsRes.value.data || [];
        const upcoming = all
          .filter(b => b.status === 'confirmed' || b.status === 'pending')
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        setBookings(upcoming);
      }
      // Produits populaires (sans auth)
      try {
        const popRes = await getPopularProductsAPI(12);
        setPopularProducts(popRes.data?.products || []);
      } catch (_) {}
    } catch (err) {
      console.log('Home fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // ── Recherche intelligente avec debounce ──
  const handleSearch = useCallback((text) => {
    setQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim() || text.trim().length < 2) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await searchGlobalAPI(text.trim());
        setSearchResults(res.data);
      } catch (err) {
        console.log('Search error:', err.message);
        setSearchResults({ products: [], pets: [], petsitters: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 350);
  }, []);

  const { canInstall, isIOS, promptInstall } = usePWAInstall();
  const firstName = user?.name?.split(' ')[0] || null;
  const hour = new Date().getHours();
  const greetText = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bonne journee' : 'Bonsoir';

  const features = [
    {
      icon: 'camera',
      title: 'Scanner',
      subtitle: 'Analyser un aliment',
      gradient: ['#527A56', '#6B8F71'],
      onPress: () => navigation.navigate('Scanner'),
    },
    {
      icon: 'heart',
      title: 'Pet-sitters',
      subtitle: 'Trouver un pet-sitter',
      gradient: ['#6B8F71', '#8CB092'],
      onPress: () => navigation.navigate('Garde'),
    },
    {
      icon: 'users',
      title: 'Animaux',
      subtitle: 'Mes compagnons',
      gradient: ['#C4956A', '#D4AD86'],
      onPress: () => navigation.navigate('Profil', { screen: 'MyPets' }),
    },
    {
      icon: 'message-circle',
      title: 'Assistant IA',
      subtitle: 'Posez vos questions',
      gradient: ['#527A56', '#8CB092'],
      onPress: () => navigation.navigate('Assistant'),
    },
    {
      icon: 'tag',
      title: 'Marketplace',
      subtitle: 'Acheter & vendre',
      gradient: ['#B0BAB3', '#C8CFC9'],
      disabled: true,
      comingSoon: 'Q3 2026',
    },
    {
      icon: 'map-pin',
      title: 'Vétérinaires',
      subtitle: 'Trouver un véto',
      gradient: ['#B0BAB3', '#C8CFC9'],
      disabled: true,
      comingSoon: 'Q4 2026',
    },
  ];

  // Responsive helpers
  const centerWrap = { maxWidth: contentWidth, alignSelf: 'center', width: '100%' };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ── Hero Header — Apple-grade ── */}
        <LinearGradient
          colors={['#527A56', '#6B8F71', '#8CB092']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          <View style={s.heroCircle1} />
          <View style={s.heroCircle2} />
          <View style={s.heroCircle3} />

          <View style={[s.heroInner, { paddingHorizontal: hPadding }, centerWrap]}>
            <View style={s.heroTop}>
              <View style={s.heroGreetBox}>
                <View style={s.heroGreetRow}>
                  <PawIcon size={18} color="rgba(255,255,255,0.9)" />
                  <Text style={s.greeting}>{greetText}</Text>
                </View>
                {firstName
                  ? <Text style={s.userName}>{firstName}</Text>
                  : <Text style={s.userNameSub}>Bienvenue !</Text>
                }
              </View>
              <TouchableOpacity
                style={s.avatarBtn}
                onPress={() => navigation.navigate('Profil')}
                activeOpacity={0.8}
              >
                {user?.name
                  ? <Text style={s.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                  : <Feather name="user" size={22} color="#FFF" />
                }
              </TouchableOpacity>
            </View>

            <View style={s.searchBar}>
              <Feather name="search" size={18} color="rgba(255,255,255,0.7)" />
              <TextInput
                style={s.searchInput}
                value={query}
                onChangeText={handleSearch}
                placeholder="Rechercher un produit, un pet-sitter…"
                placeholderTextColor="rgba(255,255,255,0.55)"
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              {searchLoading && (
                <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" style={{ marginRight: 8 }} />
              )}
              {query.length > 0 && (
                <TouchableOpacity onPress={() => { handleSearch(''); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name="x" size={16} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* ── Résultats de recherche intelligente ── */}
        {query.trim().length > 0 && (() => {
          // Quick actions matching
          const q = query.trim().toLowerCase();
          const quickActions = [
            { icon: 'camera', title: 'Scanner', subtitle: 'Analyser un aliment', onPress: () => navigation.navigate('Scanner'), keywords: ['scan', 'scanner', 'barcode', 'code-barre', 'analyser', 'aliment'] },
            { icon: 'heart', title: 'Pet-sitters', subtitle: 'Trouver un pet-sitter', onPress: () => navigation.navigate('Garde'), keywords: ['pet-sitter', 'sitter', 'garde', 'gardien', 'garder'] },
            { icon: 'users', title: 'Mes animaux', subtitle: 'Gérer mes compagnons', onPress: () => navigation.navigate('Profil', { screen: 'MyPets' }), keywords: ['animal', 'animaux', 'chien', 'chat', 'compagnon', 'pet'] },
            { icon: 'message-circle', title: 'Assistant IA', subtitle: 'Poser une question', onPress: () => navigation.navigate('Assistant'), keywords: ['ia', 'ai', 'assistant', 'question', 'aide', 'help'] },
            { icon: 'calendar', title: 'Réservations', subtitle: 'Mes gardes à venir', onPress: () => navigation.navigate('Garde'), keywords: ['réservation', 'booking', 'garde', 'calendrier'] },
            { icon: 'settings', title: 'Réglages', subtitle: 'Paramètres du compte', onPress: () => navigation.navigate('Profil', { screen: 'Settings' }), keywords: ['réglage', 'paramètre', 'settings', 'compte', 'profil'] },
            { icon: 'list', title: 'Historique scans', subtitle: 'Tous les produits scannés', onPress: () => navigation.navigate('Scanner', { screen: 'ScanHistory' }), keywords: ['historique', 'scan', 'history', 'produit'] },
            { icon: 'user', title: 'Mon profil', subtitle: 'Voir et modifier mon profil', onPress: () => navigation.navigate('Profil'), keywords: ['profil', 'profile', 'compte', 'mon'] },
          ];
          const matchedActions = quickActions.filter(a =>
            a.title.toLowerCase().includes(q) ||
            a.subtitle.toLowerCase().includes(q) ||
            a.keywords.some(kw => kw.includes(q) || q.includes(kw))
          );

          const sr = searchResults || { products: [], pets: [], petsitters: [] };
          const totalResults = sr.products.length + sr.pets.length + sr.petsitters.length + matchedActions.length;

          return (
            <View style={[s.searchResults, { paddingHorizontal: hPadding }, centerWrap]}>
              {/* Header */}
              <View style={s.srHeader}>
                <Text style={s.srHeaderTitle}>
                  {searchLoading ? 'Recherche en cours…' : `${totalResults} résultat${totalResults !== 1 ? 's' : ''}`}
                </Text>
                {!searchLoading && <Text style={s.srHeaderQuery}>« {query.trim()} »</Text>}
              </View>

              {/* Quick actions */}
              {matchedActions.length > 0 && (
                <View style={s.srSection}>
                  <View style={s.srSectionHeader}>
                    <View style={[s.srSectionIcon, { backgroundColor: COLORS.primarySoft }]}>
                      <Feather name="zap" size={14} color={COLORS.primary} />
                    </View>
                    <Text style={s.srSectionTitle}>Accès rapide</Text>
                  </View>
                  {matchedActions.slice(0, 4).map((action, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={s.srActionRow}
                      onPress={action.onPress}
                      activeOpacity={0.7}
                    >
                      <View style={s.srActionIcon}>
                        <Feather name={action.icon} size={18} color={COLORS.primary} />
                      </View>
                      <View style={s.srActionText}>
                        <Text style={s.srActionTitle}>{action.title}</Text>
                        <Text style={s.srActionSub}>{action.subtitle}</Text>
                      </View>
                      <Feather name="chevron-right" size={16} color={COLORS.textTertiary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Produits */}
              {sr.products.length > 0 && (
                <View style={s.srSection}>
                  <View style={s.srSectionHeader}>
                    <View style={[s.srSectionIcon, { backgroundColor: '#EFF5F0' }]}>
                      <Feather name="package" size={14} color="#527A56" />
                    </View>
                    <Text style={s.srSectionTitle}>Produits</Text>
                    <View style={s.srBadge}>
                      <Text style={s.srBadgeText}>{sr.products.length}</Text>
                    </View>
                  </View>
                  {sr.products.slice(0, 5).map((product, idx) => {
                    const score = product.nutritionScore || 0;
                    const color = getScoreColor(score);
                    return (
                      <TouchableOpacity
                        key={product._id || idx}
                        style={s.srProductRow}
                        onPress={() => navigation.navigate('Scanner', { screen: 'ProductResult', params: { product } })}
                        activeOpacity={0.7}
                      >
                        <View style={[s.srProductScore, { backgroundColor: color + '14' }]}>
                          <Text style={[s.srProductScoreNum, { color }]}>{score}</Text>
                        </View>
                        <View style={s.srProductInfo}>
                          <Text style={s.srProductName} numberOfLines={1}>{product.name}</Text>
                          <Text style={s.srProductBrand} numberOfLines={1}>{product.brand || 'Marque inconnue'}</Text>
                        </View>
                        <View style={[s.srProductLabel, { backgroundColor: color + '12' }]}>
                          <Text style={[s.srProductLabelText, { color }]}>{getScoreLabel(score)}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Pet-sitters */}
              {sr.petsitters.length > 0 && (
                <View style={s.srSection}>
                  <View style={s.srSectionHeader}>
                    <View style={[s.srSectionIcon, { backgroundColor: '#FDF5ED' }]}>
                      <Feather name="heart" size={14} color={COLORS.accent} />
                    </View>
                    <Text style={s.srSectionTitle}>Pet-sitters</Text>
                    <View style={s.srBadge}>
                      <Text style={s.srBadgeText}>{sr.petsitters.length}</Text>
                    </View>
                  </View>
                  {sr.petsitters.slice(0, 5).map((sitter, idx) => (
                    <TouchableOpacity
                      key={sitter._id || idx}
                      style={s.srSitterRow}
                      onPress={() => navigation.navigate('Garde', { screen: 'PetSitterDetail', params: { sitterId: sitter._id } })}
                      activeOpacity={0.7}
                    >
                      <View style={s.srSitterAvatar}>
                        {sitter.user?.name ? (
                          <Text style={s.srSitterAvatarText}>{sitter.user.name.charAt(0).toUpperCase()}</Text>
                        ) : (
                          <Feather name="user" size={18} color={COLORS.textTertiary} />
                        )}
                      </View>
                      <View style={s.srSitterInfo}>
                        <Text style={s.srSitterName} numberOfLines={1}>{sitter.user?.name || 'Pet-sitter'}</Text>
                        <Text style={s.srSitterBio} numberOfLines={1}>{sitter.bio || 'Pet-sitter disponible'}</Text>
                      </View>
                      {sitter.pricePerDay > 0 && (
                        <View style={s.srSitterPrice}>
                          <Text style={s.srSitterPriceText}>{sitter.pricePerDay}€</Text>
                          <Text style={s.srSitterPriceUnit}>/jour</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Mes animaux */}
              {sr.pets.length > 0 && (
                <View style={s.srSection}>
                  <View style={s.srSectionHeader}>
                    <View style={[s.srSectionIcon, { backgroundColor: '#F0EFF5' }]}>
                      <Feather name="github" size={14} color="#6B718F" />
                    </View>
                    <Text style={s.srSectionTitle}>Mes animaux</Text>
                    <View style={s.srBadge}>
                      <Text style={s.srBadgeText}>{sr.pets.length}</Text>
                    </View>
                  </View>
                  {sr.pets.map((pet, idx) => {
                    const speciesEmoji = { chien: '🐶', chat: '🐱', oiseau: '🐦', rongeur: '🐹', reptile: '🦎', poisson: '🐟' };
                    return (
                      <TouchableOpacity
                        key={pet._id || idx}
                        style={s.srPetRow}
                        onPress={() => navigation.navigate('Profil', { screen: 'MyPets' })}
                        activeOpacity={0.7}
                      >
                        <View style={s.srPetEmoji}>
                          <Text style={{ fontSize: 22 }}>{speciesEmoji[pet.species] || '🐾'}</Text>
                        </View>
                        <View style={s.srPetInfo}>
                          <Text style={s.srPetName}>{pet.name}</Text>
                          <Text style={s.srPetSpecies}>{pet.breed || pet.species || 'Animal'}</Text>
                        </View>
                        <Feather name="chevron-right" size={16} color={COLORS.textTertiary} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Empty state */}
              {!searchLoading && totalResults === 0 && (
                <View style={s.srEmpty}>
                  <View style={s.srEmptyIconWrap}>
                    <Feather name="search" size={36} color={COLORS.textTertiary} />
                  </View>
                  <Text style={s.srEmptyTitle}>Aucun résultat</Text>
                  <Text style={s.srEmptyText}>Essaie avec d'autres mots-clés</Text>
                  <TouchableOpacity
                    style={s.srEmptyBtn}
                    onPress={() => navigation.navigate('Scanner')}
                    activeOpacity={0.8}
                  >
                    <Feather name="camera" size={16} color="#FFF" />
                    <Text style={s.srEmptyBtnText}>Scanner un produit</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })()}

        {/* ── Contenu principal (masqué pendant la recherche) ── */}
        {query.trim().length === 0 && <>

        {/* ── Mes animaux ── */}
        {pets.length > 0 && (
          <View style={[s.petsSection, { paddingLeft: hPadding }]}>
            <View style={[s.sectionHeader, { paddingRight: hPadding, maxWidth: contentWidth, alignSelf: 'center', width: '100%' }]}>
              <Text style={s.sectionTitle}>Mes compagnons</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Profil', { screen: 'MyPets' })}>
                <Text style={s.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.petsScroll}>
              {pets.map((pet, idx) => <PetMiniCard key={pet._id || idx} pet={pet} />)}
              <TouchableOpacity style={s.petMiniAdd} onPress={() => navigation.navigate('Profil', { screen: 'AddPet' })}>
                <View style={s.petMiniAddCircle}><Text style={s.petMiniAddIcon}>+</Text></View>
                <Text style={s.petMiniAddLabel}>Ajouter</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* ── Que faire ? — Feature cards (grille 2 colonnes) ── */}
        <View style={[s.featuresSection, { paddingHorizontal: hPadding }, centerWrap]}>
          <Text style={s.sectionTitle}>Que voulez-vous faire ?</Text>
          <View style={s.featuresGrid}>
            {features.map((f, idx) => (
              <PressableCard
                key={idx}
                onPress={f.onPress}
                disabled={f.disabled}
                style={s.featureCardWrapper}
              >
                <LinearGradient
                  colors={f.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[s.featureCard, f.disabled && s.featureCardDisabled]}
                >
                  <View style={s.featureCardTop}>
                    <View style={[s.featureIconCircle, f.disabled && s.featureIconDisabled]}>
                      <Feather name={f.icon} size={22} color={f.disabled ? 'rgba(255,255,255,0.5)' : '#FFF'} />
                    </View>
                    {f.comingSoon && (
                      <View style={s.featureComingSoonPill}>
                        <Text style={s.featureComingSoonText}>{f.comingSoon}</Text>
                      </View>
                    )}
                  </View>
                  <View>
                    <Text style={[s.featureTitle, f.disabled && s.featureTitleDisabled]}>{f.title}</Text>
                    <Text style={[s.featureSubtitle, f.disabled && s.featureSubDisabled]}>{f.subtitle}</Text>
                  </View>
                </LinearGradient>
              </PressableCard>
            ))}
          </View>
        </View>

        {/* ── Installer l'app (PWA) ── */}
        {canInstall && (
          <View style={[s.installSection, { paddingHorizontal: hPadding }, centerWrap]}>
            <TouchableOpacity
              style={s.installCard}
              onPress={isIOS ? undefined : promptInstall}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#527A56', '#6B8F71']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.installGradient}
              >
                <View style={s.installIconCircle}>
                  <Feather name="download" size={22} color="#527A56" />
                </View>
                <View style={s.installTextWrap}>
                  <Text style={s.installTitle}>Installer Pepete</Text>
                  <Text style={s.installSubtitle}>
                    {isIOS
                      ? 'Appuyez sur Partager puis "Sur l\'ecran d\'accueil"'
                      : 'Ajoutez l\'app sur votre ecran d\'accueil'}
                  </Text>
                </View>
                {!isIOS && (
                  <View style={s.installBtnInner}>
                    <Text style={s.installBtnText}>Installer</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Tableau de bord — Stats cards ── */}
        <View style={[s.statsSection, { paddingHorizontal: hPadding }, centerWrap]}>
          <Text style={s.sectionTitle}>Mon tableau de bord</Text>
          <View style={s.statsCard}>
            {[
              { value: recentScans.length, label: 'Produits\nscannés', featherIcon: 'camera', color: '#6B8F71' },
              { value: pets.length, label: 'Animaux\nenregistrés', featherIcon: 'heart', color: '#527A56' },
              { value: bookings.length, label: 'Gardes\nà venir', featherIcon: 'calendar', color: '#C4956A' },
            ].map((stat, idx) => (
              <React.Fragment key={idx}>
                <View style={s.stat}>
                  <View style={[s.statIconWrap, { backgroundColor: stat.color + '0D' }]}>
                    <Feather name={stat.featherIcon} size={20} color={stat.color} />
                  </View>
                  <Text style={[s.statValue, { color: stat.color }]}>{loading ? '-' : stat.value}</Text>
                  <Text style={s.statLabel}>{stat.label}</Text>
                </View>
                {idx < 2 && <View style={s.statDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── Prochaine garde ── */}
        {bookings.length > 0 && (
          <View style={[s.bookingSection, { paddingHorizontal: hPadding }, centerWrap]}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Prochaine garde</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Garde')}>
                <Text style={s.seeAll}>Historique</Text>
              </TouchableOpacity>
            </View>
            <NextBookingCard booking={bookings[0]} />
          </View>
        )}

        {/* ── Derniers scans ── */}
        {recentScans.length > 0 && (
          <View style={[s.scansSection, { paddingHorizontal: hPadding }, centerWrap]}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Derniers scans</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Scanner', { screen: 'ScanHistory' })}>
                <Text style={s.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            {recentScans.slice(0, 3).map((scan, idx) => (
              <RecentScanCard
                key={scan._id || idx}
                scan={scan}
                onPress={() => navigation.navigate('Scanner', { screen: 'ProductResult', params: { product: scan.product } })}
              />
            ))}
          </View>
        )}

        {/* ── Accès rapide — Icon grid ── */}
        <View style={[s.quickSection, { paddingHorizontal: hPadding }, centerWrap]}>
          <Text style={s.sectionTitle}>Accès rapide</Text>
          <View style={[s.quickGrid, isTablet && s.quickGridTablet]}>
            {[
              { featherIcon: 'list', label: 'Historique\nscans', onPress: () => navigation.navigate('Scanner', { screen: 'ScanHistory' }) },
              { featherIcon: 'calendar', label: 'Réservations', onPress: () => navigation.navigate('Garde') },
              { featherIcon: 'message-circle', label: 'Messages', onPress: () => navigation.navigate('Garde', { screen: 'Messages' }) },
              { featherIcon: 'settings', label: 'Réglages', onPress: () => navigation.navigate('Profil', { screen: 'Settings' }) },
            ].map((qa, idx) => (
              <TouchableOpacity key={idx} style={[s.quickAction, isTablet && s.quickActionTablet]} onPress={qa.onPress} activeOpacity={0.7}>
                <View style={[s.quickIconWrap, isTablet && s.quickIconWrapTablet]}>
                  <Feather name={qa.featherIcon} size={isTablet ? 24 : 22} color={COLORS.primary} />
                </View>
                <Text style={[s.quickLabel, isTablet && s.quickLabelTablet]}>{qa.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Produits les + scannés ── */}
        {popularProducts.length > 0 && (
          <View style={[s.popularSection, { paddingHorizontal: hPadding }, centerWrap]}>
            <View style={s.sectionHeader}>
              <View>
                <Text style={s.sectionEyebrow}>COMMUNAUTÉ</Text>
                <Text style={s.sectionTitle}>Produits les + scannés</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Scanner', { screen: 'ScanHistory' })}>
                <Text style={s.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            {/* Grille 2 colonnes */}
            <View style={s.popGrid}>
              {popularProducts.map((product, idx) => (
                <PopularProductCard
                  key={product._id || idx}
                  product={product}
                  onPress={() => navigation.navigate('Scanner', {
                    screen: 'ProductResult',
                    params: { product },
                  })}
                />
              ))}
            </View>
          </View>
        )}


        {/* ── Bannière CTA — Premium gradient ── */}
        <View style={[s.bannerSection, { paddingHorizontal: hPadding }, centerWrap]}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Scanner')}>
            <LinearGradient
              colors={['#527A56', '#6B8F71']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.bannerGradient}
            >
              <View style={s.bannerCircleDeco} />
              <View style={s.bannerIconCircle}>
                <Feather name="zap" size={24} color="#FFF" />
              </View>
              <View style={s.bannerContent}>
                <Text style={s.bannerTitle}>Contrôlez ce que mange votre animal</Text>
                <Text style={s.bannerText}>Scannez les emballages pour connaître la qualité de chaque produit.</Text>
                <View style={s.bannerBtn}>
                  <Text style={s.bannerBtnText}>Scanner maintenant</Text>
                  <Feather name="arrow-right" size={14} color="#FFF" style={{ marginLeft: 6 }} />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
        </>
        }
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF6EE' },
  scrollContent: { paddingBottom: 24 },

  // Hero — fluid gradient
  hero: {
    paddingTop: Platform.OS === 'ios' ? 62 : 52,
    paddingBottom: 34,
    borderBottomLeftRadius: RADIUS['3xl'],
    borderBottomRightRadius: RADIUS['3xl'],
    overflow: 'hidden',
  },
  heroInner: {},
  heroCircle1: {
    position: 'absolute', top: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroCircle2: {
    position: 'absolute', bottom: -70, left: -50,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroCircle3: {
    position: 'absolute', top: 40, left: '40%',
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  heroGreetBox: {},
  heroGreetRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  greeting: { fontSize: 12, color: 'rgba(255,255,255,0.82)', fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase' },
  userName:    { fontSize: 38, fontWeight: '900', color: '#FFF', letterSpacing: -1.2, marginTop: 2 },
  userNameSub: { fontSize: 28, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: -0.8, marginTop: 2 },
  avatarBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: '#FFF' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.lg, paddingHorizontal: 18, height: 52, gap: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  searchInput: {
    flex: 1, fontSize: FONT_SIZE.sm, color: '#FFF', fontWeight: '500',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },

  // Section header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, letterSpacing: -0.8 },
  seeAll: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.primary },

  // Pets
  petsSection: { marginTop: 26 },
  petsScroll: { gap: 14, paddingRight: 20 },
  petMini: { alignItems: 'center', width: 74 },
  petMiniAvatar: {
    width: 62, height: 62, borderRadius: 31,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, marginBottom: 8,
  },
  petMiniLetter: { fontSize: 16, fontWeight: '800' },
  petMiniName: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  petMiniAdd: { alignItems: 'center', width: 74, justifyContent: 'center' },
  petMiniAddCircle: {
    width: 62, height: 62, borderRadius: 31,
    borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  petMiniAddIcon: { fontSize: 24, color: COLORS.textTertiary },
  petMiniAddLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.textTertiary },

  // Features — grille 2 colonnes
  featuresSection: { marginTop: 28 },
  featuresGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 12, marginTop: 16,
  },
  featureCardWrapper: {
    width: '47%', flexGrow: 1,
  },
  featureCard: {
    borderRadius: RADIUS.xl, padding: 16,
    height: 140, justifyContent: 'space-between',
    ...SHADOWS.lg,
  },
  featureCardDisabled: {
    opacity: 0.65,
  },
  featureCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  featureIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  featureIconDisabled: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  featureComingSoonPill: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  featureComingSoonText: {
    fontSize: 9, fontWeight: '700', color: '#FFF',
    letterSpacing: 0.5,
  },
  featureTitle: { fontSize: 15, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  featureTitleDisabled: { color: 'rgba(255,255,255,0.7)' },
  featureSubtitle: { fontSize: FONT_SIZE.xs, color: 'rgba(255,255,255,0.80)', fontWeight: '500', marginTop: 2 },
  featureSubDisabled: { color: 'rgba(255,255,255,0.5)' },

  // Stats — clean card
  statsSection: { marginTop: 32 },
  statsCard: {
    backgroundColor: '#FEFCF7', borderRadius: RADIUS.xl,
    paddingVertical: 28, paddingHorizontal: 8,
    flexDirection: 'row', justifyContent: 'space-around',
    ...SHADOWS.card, marginTop: 16,
    borderWidth: 1, borderColor: '#F0EDE4',
  },
  stat: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, backgroundColor: '#EDE9E1', marginVertical: 10 },
  statIconWrap: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  statValue: { fontSize: 36, fontWeight: '900', letterSpacing: -1.2 },
  statLabel: { fontSize: FONT_SIZE['2xs'], color: COLORS.textSecondary, fontWeight: '600', marginTop: 4, textAlign: 'center', lineHeight: 15 },

  // Booking — premium gradient
  bookingSection: { marginTop: 32 },
  bookingCard: { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOWS.lg, marginTop: 16 },
  bookingGradient: { padding: 22, borderRadius: RADIUS.xl },
  bookingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bookingBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: RADIUS.pill, paddingHorizontal: 14, paddingVertical: 6,
  },
  bookingBadgeText: { color: '#FFF', fontWeight: '700', fontSize: FONT_SIZE.sm },
  bookingPrice: { color: '#FFF', fontWeight: '900', fontSize: FONT_SIZE['2xl'], letterSpacing: -0.5 },
  bookingService: { color: '#FFF', fontWeight: '700', fontSize: FONT_SIZE.lg, marginBottom: 12 },
  bookingMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookingMetaText: { color: 'rgba(255,255,255,0.88)', fontSize: FONT_SIZE.sm, fontWeight: '500' },
  bookingStatusBadge: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: RADIUS.pill, paddingHorizontal: 12, paddingVertical: 4 },
  bookingStatusText: { color: '#FFF', fontSize: FONT_SIZE.xs, fontWeight: '700' },

  // Scans — refined cards
  scansSection: { marginTop: 32 },
  scanCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 16, marginTop: 10,
    ...SHADOWS.card,
  },
  scanScoreBadge: { width: 52, height: 52, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  scanScoreText: { fontSize: FONT_SIZE.lg, fontWeight: '900' },
  scanScoreMax: { fontSize: FONT_SIZE['2xs'], fontWeight: '600' },
  scanInfo: { flex: 1, marginRight: 8 },
  scanName: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.text },
  scanBrand: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 3 },
  scanLabel: { borderRadius: RADIUS.pill, paddingHorizontal: 12, paddingVertical: 5 },
  scanLabelText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },

  // Quick actions — clean icons
  quickSection: { marginTop: 32 },
  quickGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  quickGridTablet: { gap: 14 },
  quickAction: { alignItems: 'center', flex: 1 },
  quickActionTablet: { flex: 0, width: 100 },
  quickIconWrap: {
    width: 60, height: 60, borderRadius: RADIUS.xl,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.card, marginBottom: 8,
  },
  quickIconWrapTablet: { width: 72, height: 72, borderRadius: RADIUS['2xl'] },
  quickLabel: { fontSize: FONT_SIZE['2xs'], color: COLORS.textSecondary, fontWeight: '600', textAlign: 'center', lineHeight: 15 },
  quickLabelTablet: { fontSize: FONT_SIZE.xs, lineHeight: 17 },

  // Smart search results
  searchResults: { marginTop: 20, paddingBottom: 20 },

  srHeader: { marginBottom: 16 },
  srHeaderTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  srHeaderQuery: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary, marginTop: 2 },

  srSection: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 16, marginBottom: 14,
    ...SHADOWS.card, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  srSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  srSectionIcon: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  srSectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, flex: 1 },
  srBadge: {
    backgroundColor: COLORS.primarySoft, borderRadius: RADIUS.pill,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  srBadgeText: { fontSize: 12, fontWeight: '800', color: COLORS.primary },

  // Quick actions
  srActionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
    gap: 14,
  },
  srActionIcon: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  srActionText: { flex: 1 },
  srActionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  srActionSub: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500', marginTop: 1 },

  // Products
  srProductRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
    gap: 12,
  },
  srProductScore: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  srProductScoreNum: { fontSize: 18, fontWeight: '900' },
  srProductInfo: { flex: 1 },
  srProductName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  srProductBrand: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500', marginTop: 2 },
  srProductLabel: { borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 4 },
  srProductLabelText: { fontSize: 11, fontWeight: '700' },

  // Pet-sitters
  srSitterRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
    gap: 12,
  },
  srSitterAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.primaryMuted,
  },
  srSitterAvatarText: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  srSitterInfo: { flex: 1 },
  srSitterName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  srSitterBio: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500', marginTop: 2 },
  srSitterPrice: { alignItems: 'flex-end' },
  srSitterPriceText: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  srSitterPriceUnit: { fontSize: 10, fontWeight: '600', color: COLORS.textTertiary },

  // Pets
  srPetRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
    gap: 12,
  },
  srPetEmoji: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  srPetInfo: { flex: 1 },
  srPetName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  srPetSpecies: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500', marginTop: 2 },

  // Empty
  srEmpty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  srEmptyIconWrap: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  srEmptyTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  srEmptyText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  srEmptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.pill,
    paddingHorizontal: 22, paddingVertical: 13, marginTop: 8,
  },
  srEmptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // Popular products
  popularSection: { marginTop: 32 },
  sectionEyebrow: { fontSize: 11, fontWeight: '800', color: COLORS.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  popGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  popCard: {
    width: '47.5%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    ...SHADOWS.card,
  },
  popScoreBadge: { alignSelf: 'flex-end', borderRadius: RADIUS.md, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'baseline', gap: 1, marginBottom: 10 },
  popScoreNum: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  popScoreMax: { fontSize: 11, fontWeight: '700' },
  popBody: { flex: 1, marginBottom: 12 },
  popAnimal: { fontSize: 20, marginBottom: 6 },
  popName: { fontSize: 13, fontWeight: '800', color: COLORS.text, lineHeight: 18, marginBottom: 4 },
  popBrand: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  popBarTrack: { height: 5, backgroundColor: COLORS.borderLight, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  popBarFill: { height: '100%', borderRadius: 3 },
  popBarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  popLabel: { fontSize: 11, fontWeight: '800' },
  popScanBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  popScanCount: { fontSize: 10, color: COLORS.textTertiary, fontWeight: '600' },

  // Banner — premium CTA
  bannerSection: { marginTop: 32 },
  bannerGradient: { borderRadius: RADIUS.xl, padding: 24, ...SHADOWS.lg, overflow: 'hidden' },
  bannerCircleDeco: {
    position: 'absolute', top: -30, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bannerIconCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  bannerContent: {},
  bannerTitle: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: '#FFF', marginBottom: 8, lineHeight: 26 },
  bannerText: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.82)', lineHeight: 21, marginBottom: 18 },
  bannerBtn: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: RADIUS.pill, paddingHorizontal: 18, paddingVertical: 10,
  },
  bannerBtnText: { color: '#FFF', fontWeight: '700', fontSize: FONT_SIZE.sm },

  // Install PWA
  installSection: { marginTop: SPACING.lg },
  installCard: { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOWS.lg },
  installGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 14,
  },
  installIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  installTextWrap: { flex: 1 },
  installTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  installSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 2,
  },
  installBtnInner: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  installBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13,
  },
});

export default HomeScreen;
