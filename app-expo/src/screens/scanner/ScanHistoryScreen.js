import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getScanHistoryAPI } from '../../api/products';
const { COLORS, SHADOWS, RADIUS, SPACING, FONT_SIZE, getScoreColor, getScoreBg, getScoreLabel } = require('../../utils/colors');

const TOP_PADDING = Platform.OS === 'ios' ? 58 : 48;

const FILTER_OPTIONS = [
  { key: 'all', label: 'Tous', icon: null, color: COLORS.primary },
  { key: 'excellent', label: 'Excellent', icon: null, color: COLORS.scoreExcellent },
  { key: 'good', label: 'Bon', icon: null, color: COLORS.scoreGood },
  { key: 'mediocre', label: 'Moyen', icon: null, color: COLORS.scoreMediocre },
  { key: 'bad', label: 'Mauvais', icon: null, color: COLORS.scoreVeryBad },
];

const ScanHistoryScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [error, setError] = useState(false);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadHistory();
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    filterHistory();
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

  const filterHistory = () => {
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

    setFilteredHistory(filtered);
  };

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

  const renderItem = ({ item, index }) => {
    const product = item.product;
    if (!product) return null;

    const score = product.nutritionScore;
    const hasScore = score !== null && score !== undefined;
    const displayScore = hasScore ? score : '--';
    const scoreColor = hasScore ? getScoreColor(score) : COLORS.textTertiary;
    const scoreBgColor = hasScore ? getScoreBg(score) : COLORS.background;
    const label = hasScore ? getScoreLabel(score) : '';

    return (
      <TouchableOpacity
        style={styles.historyCard}
        onPress={() => navigation.navigate('ProductResult', { product })}
        activeOpacity={0.65}
      >
        {/* Score circle */}
        <View style={styles.cardScoreSection}>
          <View style={[styles.scoreBadge, { backgroundColor: scoreBgColor, borderColor: scoreColor + '30' }]}>
            <Text style={[styles.scoreNumberCard, { color: scoreColor }]}>{displayScore}</Text>
          </View>
          {label ? (
            <Text style={[styles.scoreLabelCard, { color: scoreColor }]} numberOfLines={1}>{label}</Text>
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
              <Text style={styles.dateIcon}>🕐</Text>
              <Text style={styles.dateText}>{formatDate(item.scannedAt)}</Text>
            </View>
          ) : null}
        </View>

        {/* Chevron */}
        <View style={styles.chevronContainer}>
          <Text style={styles.chevronIcon}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: COLORS.errorSoft }]}>
            <Text style={styles.emptyIcon}>⚠️</Text>
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
            <Text style={styles.retryButtonText}>Reessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Text style={styles.emptyIcon}>
            {searchQuery || activeFilter !== 'all' ? '🔍' : '📦'}
          </Text>
        </View>
        <Text style={styles.emptyTitle}>
          {searchQuery || activeFilter !== 'all'
            ? 'Aucun resultat'
            : 'Aucun scan pour le moment'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery || activeFilter !== 'all'
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
              <Text style={styles.emptyButtonIcon}>📷</Text>
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
        <Text style={styles.searchIcon}>🔍</Text>
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
              <Text style={styles.clearSearchText}>✕</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips - horizontal scroll */}
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
                  backgroundColor: filter.color + '15',
                  borderColor: filter.color + '40',
                },
              ]}
              onPress={() => setActiveFilter(filter.key)}
              activeOpacity={0.7}
            >
              {filter.key !== 'all' && (
                <View style={[styles.filterDot, { backgroundColor: filter.color }]} />
              )}
              <Text
                style={[
                  styles.filterText,
                  isActive && { color: filter.color, fontWeight: '700' },
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
        <Text style={styles.resultsCount}>
          {filteredHistory.length} {filteredHistory.length <= 1 ? 'produit' : 'produits'}
          {activeFilter !== 'all' || searchQuery
            ? ` (filtre${filteredHistory.length > 1 ? 's' : ''})`
            : ''}
        </Text>
      </View>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient
          colors={COLORS.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.backIcon}>{'‹'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Historique</Text>
            <View style={styles.headerPlaceholder} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
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
        colors={COLORS.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backIcon}>{'‹'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historique</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{history.length}</Text>
          </View>
        </View>
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
    backgroundColor: COLORS.background,
  },

  // Header
  headerGradient: {
    paddingTop: TOP_PADDING,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    borderBottomLeftRadius: RADIUS['2xl'],
    borderBottomRightRadius: RADIUS['2xl'],
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 26,
    color: COLORS.white,
    fontWeight: '400',
    marginTop: -2,
    lineHeight: 28,
  },
  headerTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    minWidth: 38,
    alignItems: 'center',
  },
  headerBadgeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerPlaceholder: {
    width: 38,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Content
  content: {
    flex: 1,
    marginTop: -SPACING.md,
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING['3xl'],
  },

  // List header
  listHeader: {
    paddingTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    color: COLORS.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? SPACING.md + 2 : SPACING.md,
    fontWeight: '500',
  },
  clearSearch: {
    padding: SPACING.xs,
  },
  clearCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 1,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: 5,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Results info
  resultsInfo: {
    marginTop: SPACING.base,
    marginBottom: SPACING.xs,
  },
  resultsCount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },

  // History cards
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    ...SHADOWS.md,
  },
  cardScoreSection: {
    alignItems: 'center',
    marginRight: SPACING.base,
    width: 58,
  },
  scoreBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  scoreNumberCard: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  scoreLabelCard: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardInfoSection: {
    flex: 1,
  },
  productName: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  productBrand: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateIcon: {
    fontSize: 11,
  },
  dateText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    color: COLORS.textTertiary,
  },
  chevronContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  chevronIcon: {
    fontSize: 20,
    color: COLORS.textTertiary,
    fontWeight: '400',
    marginTop: -1,
  },
  separator: {
    height: SPACING.md,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING['5xl'],
    paddingHorizontal: SPACING.xl,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  emptyButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  emptyButtonIcon: {
    fontSize: 18,
  },
  emptyButtonText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: COLORS.white,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  retryButtonText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.textTertiary,
  },
});

export default ScanHistoryScreen;
