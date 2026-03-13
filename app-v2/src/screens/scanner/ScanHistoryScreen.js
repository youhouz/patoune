import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
  TextInput,
  Animated,
  RefreshControl,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getScanHistoryAPI } from '../../api/products';
import { FONTS } from '../../utils/typography';
import { COLORS, SHADOWS, RADIUS, SPACING, FONT_SIZE, getScoreColor, getScoreBg, getScoreLabel } from '../../utils/colors';
import { showAlert } from '../../utils/alert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const FILTER_OPTIONS = [
  { key: 'all', label: 'Tous', icon: 'grid', color: COLORS.primary },
  { key: 'excellent', label: 'Excellent', icon: null, color: COLORS.scoreExcellent },
  { key: 'good', label: 'Bon', icon: null, color: COLORS.scoreGood },
  { key: 'mediocre', label: 'Moyen', icon: null, color: COLORS.scoreMediocre },
  { key: 'bad', label: 'Mauvais', icon: null, color: COLORS.scoreVeryBad },
];

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch (_) {
    return '';
  }
};

const HistoryCard = React.memo(({ item, isLast, onPress, onButtonPressIn, onButtonPressOut }) => {
  const product = item.product;
  if (!product) return null;

  const score = product.nutritionScore;
  const hasScore = score !== null && score !== undefined;
  const displayScore = hasScore ? score : '--';
  const scoreColor = hasScore ? getScoreColor(score) : COLORS.pebble;
  const scoreBgColor = hasScore ? getScoreBg(score) : COLORS.linen;
  const label = hasScore ? getScoreLabel(score) : '';

  const cardScale = useRef(new Animated.Value(1)).current;

  return (
    <AnimatedTouchable
      style={[styles.historyCard, { transform: [{ scale: cardScale }] }]}
      onPress={onPress}
      onPressIn={() => onButtonPressIn(cardScale)}
      onPressOut={() => onButtonPressOut(cardScale)}
      activeOpacity={1}
    >
      {/* Timeline connector */}
      <View style={styles.timelineConnector}>
        <View style={[styles.timelineDot, { backgroundColor: scoreColor + '30', borderColor: scoreColor }]} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>

      {/* Card content */}
      <View style={styles.cardBody}>
        {/* Score circle */}
        <View style={styles.cardScoreSection}>
          <View style={[styles.scoreRingOuter, { borderColor: scoreColor + '25' }]}>
            <View style={[styles.scoreBadge, { backgroundColor: scoreBgColor }]}>
              <Text style={[styles.scoreNumberCard, { color: scoreColor }]}>{displayScore}</Text>
            </View>
          </View>
          {label ? (
            <View style={[styles.scoreLabelPill, { backgroundColor: scoreColor + '12' }]}>
              <Text style={[styles.scoreLabelCard, { color: scoreColor }]} numberOfLines={1}>{label}</Text>
            </View>
          ) : null}
        </View>

        {/* Product info */}
        <View style={styles.cardInfoSection}>
          <Text style={styles.productName} numberOfLines={1}>
            {product.name || 'Produit inconnu'}
          </Text>
          {product.brand ? (
            <Text style={styles.productBrand} numberOfLines={1}>
              {product.brand}
            </Text>
          ) : null}
          {item.scannedAt ? (
            <View style={styles.dateBadge}>
              <Feather name="clock" size={11} color={COLORS.pebble} />
              <Text style={styles.dateText}>{formatDate(item.scannedAt)}</Text>
            </View>
          ) : null}
        </View>

        {/* Chevron */}
        <View style={styles.chevronContainer}>
          <LinearGradient
            colors={[COLORS.primarySoft, '#FFF5F0']}
            style={styles.chevronGradient}
          >
            <Feather name="chevron-right" size={16} color={COLORS.primary} />
          </LinearGradient>
        </View>
      </View>
    </AnimatedTouchable>
  );
});

const ScanHistoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [error, setError] = useState(false);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const headerScale = useRef(new Animated.Value(0.96)).current;
  const backScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadHistory();
    Animated.stagger(80, [
      Animated.spring(headerScale, {
        toValue: 1,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideUp, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const filteredHistory = useMemo(() => {
    let filtered = [...history];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((item) => {
        const product = item.product;
        if (!product) return false;
        return (
          (product.name && product.name.toLowerCase().includes(query)) ||
          (product.brand && product.brand.toLowerCase().includes(query)) ||
          (product.barcode && product.barcode.includes(query))
        );
      });
    }

    // Score filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter((item) => {
        const score = item.product?.nutritionScore;
        if (score === undefined || score === null) return false;
        switch (activeFilter) {
          case 'excellent': return score >= 80;
          case 'good': return score >= 60 && score < 80;
          case 'mediocre': return score >= 40 && score < 60;
          case 'bad': return score < 40;
          default: return true;
        }
      });
    }

    return filtered;
  }, [searchQuery, activeFilter, history]);

  const loadHistory = async () => {
    setError(false);
    try {
      const response = await getScanHistoryAPI();
      const data = response.data?.history || response.data || [];
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(true);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(false);
    try {
      const response = await getScanHistoryAPI();
      const data = response.data?.history || response.data || [];
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const onButtonPressIn = useCallback((scaleRef) => {
    Animated.spring(scaleRef, { toValue: 0.92, friction: 8, tension: 100, useNativeDriver: true }).start();
  }, []);

  const onButtonPressOut = useCallback((scaleRef) => {
    Animated.spring(scaleRef, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
  }, []);

  const renderItem = useCallback(({ item, index }) => {
    return (
      <HistoryCard
        item={item}
        isLast={index >= filteredHistory.length - 1}
        onPress={() => navigation.navigate('ProductResult', { product: item.product })}
        onButtonPressIn={onButtonPressIn}
        onButtonPressOut={onButtonPressOut}
      />
    );
  }, [filteredHistory.length, navigation, onButtonPressIn, onButtonPressOut]);

  const renderEmpty = () => {
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: COLORS.errorSoft }]}>
            <Feather name="alert-triangle" size={36} color={COLORS.error} />
          </View>
          <Text style={styles.emptyTitle}>Erreur de chargement</Text>
          <Text style={styles.emptySubtitle}>
            Impossible de recuperer l'historique. Verifiez votre connexion et reessayez.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              loadHistory();
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={COLORS.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.retryButtonGradient}
            >
              <Feather name="refresh-cw" size={16} color={COLORS.white} style={{ marginRight: 8 }} />
              <Text style={styles.retryButtonText}>Reessayer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    const isFiltered = searchQuery || activeFilter !== 'all';

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Feather
            name={isFiltered ? 'search' : 'package'}
            size={36}
            color={COLORS.primary}
          />
        </View>
        <Text style={styles.emptyTitle}>
          {isFiltered
            ? 'Aucun resultat'
            : 'Aucun scan pour le moment'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {isFiltered
            ? 'Essayez de modifier votre recherche ou vos filtres'
            : 'Scannez votre premier produit pour commencer a construire votre historique'}
        </Text>
        {!searchQuery && activeFilter === 'all' && (
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={COLORS.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.emptyButtonGradient}
            >
              <Feather name="camera" size={18} color={COLORS.white} />
              <Text style={styles.emptyButtonText}>Scanner un produit</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchIconWrap}>
          <Feather name="search" size={15} color={COLORS.primary} />
        </View>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Rechercher un produit, marque..."
          placeholderTextColor={COLORS.placeholder}
          returnKeyType="search"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearSearch}
            activeOpacity={0.7}
          >
            <View style={styles.clearCircle}>
              <Feather name="x" size={11} color={COLORS.stone} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScrollContent}
        style={styles.filtersScroll}
      >
        {FILTER_OPTIONS.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                isActive && {
                  backgroundColor: filter.color + '12',
                  borderColor: filter.color + '30',
                },
              ]}
              onPress={() => setActiveFilter(filter.key)}
              activeOpacity={0.7}
            >
              {filter.key !== 'all' && (
                <View style={[styles.filterDot, { backgroundColor: filter.color }]} />
              )}
              {filter.key === 'all' && (
                <Feather name="grid" size={12} color={isActive ? filter.color : COLORS.stone} style={{ marginRight: 2 }} />
              )}
              <Text
                style={[
                  styles.filterText,
                  isActive && { color: filter.color, fontFamily: FONTS.heading },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results count */}
      <View style={styles.resultsInfo}>
        <View style={styles.resultsLeft}>
          <Text style={styles.resultsCount}>
            {filteredHistory.length} {filteredHistory.length <= 1 ? 'produit' : 'produits'}
          </Text>
          {(activeFilter !== 'all' || searchQuery) && (
            <View style={styles.filteredBadge}>
              <Feather name="filter" size={10} color={COLORS.primary} />
              <Text style={styles.filteredText}>Filtre</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient
          colors={['#7B8B6F', '#96A88A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { paddingTop: insets.top + SPACING.md }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <View style={styles.backButtonGlass}>
                <Feather name="chevron-left" size={20} color={COLORS.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Historique</Text>
            <View style={styles.headerPlaceholder} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIconWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
          <Text style={styles.loadingText}>Chargement de l'historique...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <LinearGradient
        colors={['#7B8B6F', '#8A9A7E', '#96A88A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + SPACING.md }]}
      >
        {/* Decorative element */}
        <View style={styles.headerDecorCircle} />

        <Animated.View style={[styles.headerContent, { transform: [{ scale: headerScale }] }]}>
          <AnimatedTouchable
            style={[styles.backButton, { transform: [{ scale: backScale }] }]}
            onPress={() => navigation.goBack()}
            onPressIn={() => onButtonPressIn(backScale)}
            onPressOut={() => onButtonPressOut(backScale)}
            activeOpacity={1}
          >
            <View style={styles.backButtonGlass}>
              <Feather name="chevron-left" size={20} color={COLORS.white} />
            </View>
          </AnimatedTouchable>
          <Text style={styles.headerTitle}>Historique</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{history.length}</Text>
          </View>
        </Animated.View>
        <Text style={styles.headerSubtitle}>Vos produits scannes</Text>
      </LinearGradient>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          },
        ]}
      >
        <FlatList
          data={filteredHistory}
          renderItem={renderItem}
          keyExtractor={(item, index) => item._id || `scan-${index}`}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
              progressViewOffset={10}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  // Header
  headerGradient: {
    paddingBottom: SPACING.xl + 4,
    paddingHorizontal: SPACING.xl,
    borderBottomLeftRadius: RADIUS['3xl'],
    borderBottomRightRadius: RADIUS['3xl'],
    overflow: 'hidden',
  },
  headerDecorCircle: {
    position: 'absolute',
    top: -20,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  backButton: {},
  backButtonGlass: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontFamily: FONTS.heading,
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.full,
    minWidth: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerBadgeText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.heading,
    color: COLORS.white,
  },
  headerPlaceholder: {
    width: 40,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: FONTS.bodyMedium,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // Content
  content: {
    flex: 1,
    marginTop: -SPACING.md,
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING['3xl'] + 20,
  },

  // List header
  listHeader: {
    paddingTop: SPACING.lg + 4,
    marginBottom: SPACING.sm,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.base,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  searchIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    color: COLORS.charcoal,
    paddingVertical: Platform.OS === 'ios' ? SPACING.md + 3 : SPACING.md + 1,
    fontFamily: FONTS.bodyMedium,
  },
  clearSearch: {
    padding: SPACING.xs,
  },
  clearCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filters
  filtersScroll: {
    marginTop: SPACING.base,
  },
  filtersScrollContent: {
    gap: SPACING.sm,
    paddingRight: SPACING.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md + 2,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: 5,
    ...SHADOWS.sm,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.stone,
  },

  // Results info
  resultsInfo: {
    marginTop: SPACING.base + 2,
    marginBottom: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  resultsCount: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.pebble,
  },
  filteredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  filteredText: {
    fontSize: 10,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.primary,
  },

  // History cards with timeline
  historyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineConnector: {
    alignItems: 'center',
    width: 24,
    paddingTop: SPACING.base + 4,
    marginRight: SPACING.sm,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: COLORS.white,
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginTop: 4,
  },
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.base + 2,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardScoreSection: {
    alignItems: 'center',
    marginRight: SPACING.base,
    width: 62,
  },
  scoreRingOuter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumberCard: {
    fontSize: FONT_SIZE.lg,
    fontFamily: FONTS.heading,
    letterSpacing: -0.5,
  },
  scoreLabelPill: {
    marginTop: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  scoreLabelCard: {
    fontSize: 9,
    fontFamily: FONTS.heading,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardInfoSection: {
    flex: 1,
  },
  productName: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.heading,
    color: COLORS.charcoal,
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  productBrand: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.stone,
    marginBottom: 6,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.pebble,
  },
  chevronContainer: {
    marginLeft: SPACING.sm,
  },
  chevronGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: SPACING.xs,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING['5xl'],
    paddingHorizontal: SPACING.xl,
  },
  emptyIconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontFamily: FONTS.heading,
    color: COLORS.charcoal,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.stone,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  emptyButton: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.glow(COLORS.primary),
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl + 4,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.xl,
    gap: SPACING.sm,
  },
  emptyButtonText: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.heading,
    color: COLORS.white,
  },
  retryButton: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.glow(COLORS.primary),
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.xl,
  },
  retryButtonText: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.heading,
    color: COLORS.white,
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  loadingIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.pebble,
  },
});

export default ScanHistoryScreen;
