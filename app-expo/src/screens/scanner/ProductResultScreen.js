import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  Share,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS } from '../../utils/typography';
const { COLORS, SHADOWS, RADIUS, SPACING, FONT_SIZE, getScoreColor, getScoreBg, getScoreLabel } = require('../../utils/colors');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCORE_RING_SIZE = 110;
const SCORE_RING_BORDER = 5;

const getRiskColor = (risk) => {
  switch (risk) {
    case 'dangerous': return COLORS.scoreVeryBad;
    case 'moderate': return COLORS.scoreMediocre;
    default: return COLORS.scoreExcellent;
  }
};

const getRiskBg = (risk) => {
  switch (risk) {
    case 'dangerous': return COLORS.scoreVeryBadBg;
    case 'moderate': return COLORS.scoreMediocreBg;
    default: return COLORS.scoreExcellentBg;
  }
};

const getRiskLabel = (risk) => {
  switch (risk) {
    case 'dangerous': return 'Dangereux';
    case 'moderate': return 'Modere';
    default: return 'Sans risque';
  }
};

const getRiskIconName = (risk) => {
  switch (risk) {
    case 'dangerous': return 'alert-triangle';
    case 'moderate': return 'zap';
    default: return 'check';
  }
};

const getScoreGradient = (score) => {
  if (score >= 80) return [COLORS.scoreExcellent, '#34D399'];
  if (score >= 60) return [COLORS.scoreGood, '#6EE7B7'];
  if (score >= 40) return [COLORS.scoreMediocre, '#FCD34D'];
  if (score >= 20) return [COLORS.scoreBad, '#FDBA74'];
  return [COLORS.scoreVeryBad, '#FCA5A5'];
};

const DETAIL_ICONS = {
  protein: 'trending-up',
  fat: 'disc',
  fiber: 'layers',
  additivesPenalty: 'activity',
  qualityBonus: 'star',
};

const ProductResultScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { product } = route.params;
  const score = product.nutritionScore ?? null;
  const hasScore = score !== null && score !== undefined;
  const displayScore = hasScore ? score : '--';
  const scoreColor = hasScore ? getScoreColor(score) : COLORS.pebble;
  const scoreLabel = hasScore ? getScoreLabel(score) : 'Non evalue';
  const scoreGradient = hasScore ? getScoreGradient(score) : [COLORS.pebble, COLORS.sand];

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const scoreScale = useRef(new Animated.Value(0.3)).current;
  const scoreOpacity = useRef(new Animated.Value(0)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const [cardsVisible, setCardsVisible] = useState(false);

  useEffect(() => {
    // Content fade in
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

    // Score badge entrance with spring
    Animated.sequence([
      Animated.delay(250),
      Animated.parallel([
        Animated.spring(scoreScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(scoreOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(ringRotate, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => setCardsVisible(true));
  }, []);

  const handleShare = async () => {
    try {
      const scoreText = hasScore ? `Score Patoune: ${score}/100 (${scoreLabel})` : 'Score en cours d\'evaluation';
      await Share.share({
        message: `${product.name} (${product.brand || 'Marque inconnue'}) - ${scoreText}. Analyse sur Patoune!`,
      });
    } catch (_) {
      // Share cancelled
    }
  };

  const ringRotation = ringRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Score breakdown values with safe defaults
  const ingredientScore = product.scoreDetails?.ingredientsScore;
  const additivesScore = product.scoreDetails?.additivesScore;
  const nutritionScoreDetail = product.scoreDetails?.nutritionScore;
  const hasBreakdown = ingredientScore != null || additivesScore != null || nutritionScoreDetail != null;

  const ingredients = product.ingredients || [];
  const additives = product.additives || [];
  const hasIngredients = ingredients.length > 0;
  const hasAdditives = additives.length > 0;
  const hasScoreDetails = product.scoreDetails != null;

  // Count risk types
  const dangerousCount = ingredients.filter(i => i.risk === 'dangerous').length;
  const moderateCount = ingredients.filter(i => i.risk === 'moderate').length;
  const safeCount = ingredients.filter(i => i.risk !== 'dangerous' && i.risk !== 'moderate').length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Header gradient colored by score */}
        <LinearGradient
          colors={scoreGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { paddingTop: insets.top + SPACING.md }]}
        >
          {/* Nav bar */}
          <View style={styles.headerNav}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Feather name="chevron-left" size={22} color={COLORS.white} />
              <Text style={styles.backText}>Retour</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Feather name="share-2" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Product image */}
          {product.image && (
            <Image source={{ uri: product.image }} style={styles.productImage} />
          )}

          {/* Score ring */}
          <Animated.View
            style={[
              styles.scoreBadgeContainer,
              {
                opacity: scoreOpacity,
                transform: [{ scale: scoreScale }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.scoreRingOuter,
                { transform: [{ rotate: ringRotation }] },
              ]}
            >
              <View style={styles.ringAccent} />
            </Animated.View>

            <View style={styles.scoreCircle}>
              <View style={styles.scoreInner}>
                <Text style={[styles.scoreNumber, !hasScore && styles.scoreNumberMuted]}>
                  {displayScore}
                </Text>
                {hasScore && <Text style={styles.scoreMax}>/100</Text>}
              </View>
            </View>
          </Animated.View>

          {/* Score label pill */}
          <View style={styles.scoreLabelBadge}>
            <Text style={styles.scoreLabelText}>{scoreLabel}</Text>
          </View>

          {/* Product info */}
          <Text style={styles.productName} numberOfLines={2}>
            {product.name || 'Produit inconnu'}
          </Text>
          {product.brand ? (
            <Text style={styles.productBrand}>{product.brand}</Text>
          ) : null}
          {product.category ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          ) : null}

          {/* Quick stats row */}
          {(hasIngredients || hasAdditives) && (
            <View style={styles.quickStats}>
              {hasIngredients && (
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatValue}>{ingredients.length}</Text>
                  <Text style={styles.quickStatLabel}>Ingredients</Text>
                </View>
              )}
              {hasAdditives && (
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatValue}>{additives.length}</Text>
                  <Text style={styles.quickStatLabel}>Additifs</Text>
                </View>
              )}
              {dangerousCount > 0 && (
                <View style={styles.quickStat}>
                  <Text style={[styles.quickStatValue, { color: '#FEE2E2' }]}>{dangerousCount}</Text>
                  <Text style={styles.quickStatLabel}>A risque</Text>
                </View>
              )}
            </View>
          )}
        </LinearGradient>

        {/* Content cards */}
        <Animated.View
          style={[
            styles.cardsContainer,
            {
              opacity: fadeIn,
              transform: [{ translateY: slideUp }],
            },
          ]}
        >
          {/* Score breakdown card */}
          {hasBreakdown && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="bar-chart-2" size={20} color={COLORS.primary} style={{ marginRight: SPACING.sm }} />
                <Text style={styles.cardTitle}>Repartition du score</Text>
              </View>

              <View style={styles.breakdownList}>
                {[
                  { label: 'Ingredients', weight: '40%', value: ingredientScore ?? 0, maxValue: 40, color: COLORS.scoreExcellent },
                  { label: 'Additifs', weight: '30%', value: additivesScore ?? 0, maxValue: 30, color: COLORS.scoreMediocre },
                  { label: 'Nutrition', weight: '30%', value: nutritionScoreDetail ?? 0, maxValue: 30, color: COLORS.info },
                ].map((item, index) => {
                  const pct = item.maxValue > 0 ? Math.min((item.value / item.maxValue) * 100, 100) : 0;
                  return (
                    <View key={index} style={styles.breakdownItem}>
                      <View style={styles.breakdownLabelRow}>
                        <Text style={styles.breakdownLabel}>{item.label}</Text>
                        <Text style={[styles.breakdownValue, { color: item.color }]}>
                          {item.value}/{item.maxValue}
                        </Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${pct}%`,
                              backgroundColor: item.color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.breakdownWeight}>Poids: {item.weight}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Ingredients summary bar */}
          {hasIngredients && (dangerousCount > 0 || moderateCount > 0) && (
            <View style={styles.riskSummaryCard}>
              <View style={styles.riskSummaryRow}>
                {dangerousCount > 0 && (
                  <View style={[styles.riskSummaryItem, { backgroundColor: COLORS.scoreVeryBadBg }]}>
                    <View style={[styles.riskSummaryDot, { backgroundColor: COLORS.scoreVeryBad }]} />
                    <Text style={[styles.riskSummaryText, { color: COLORS.scoreVeryBad }]}>
                      {dangerousCount} dangereux
                    </Text>
                  </View>
                )}
                {moderateCount > 0 && (
                  <View style={[styles.riskSummaryItem, { backgroundColor: COLORS.scoreMediocreBg }]}>
                    <View style={[styles.riskSummaryDot, { backgroundColor: COLORS.scoreMediocre }]} />
                    <Text style={[styles.riskSummaryText, { color: COLORS.scoreMediocre }]}>
                      {moderateCount} modere{moderateCount > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
                <View style={[styles.riskSummaryItem, { backgroundColor: COLORS.scoreExcellentBg }]}>
                  <View style={[styles.riskSummaryDot, { backgroundColor: COLORS.scoreExcellent }]} />
                  <Text style={[styles.riskSummaryText, { color: COLORS.scoreExcellent }]}>
                    {safeCount} sain{safeCount > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Ingredients card */}
          {hasIngredients && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="droplet" size={20} color={COLORS.primary} style={{ marginRight: SPACING.sm }} />
                <Text style={styles.cardTitle}>Ingredients</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{ingredients.length}</Text>
                </View>
              </View>

              {ingredients.map((ingredient, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.ingredientRow,
                    idx === ingredients.length - 1 && styles.lastRow,
                  ]}
                >
                  <View style={[styles.riskDot, { backgroundColor: getRiskBg(ingredient.risk) }]}>
                    <Feather
                      name={getRiskIconName(ingredient.risk)}
                      size={13}
                      color={getRiskColor(ingredient.risk)}
                    />
                  </View>
                  <View style={styles.ingredientInfo}>
                    <Text style={styles.ingredientName}>
                      {ingredient.name || 'Ingredient inconnu'}
                    </Text>
                    <Text style={[styles.ingredientRiskText, { color: getRiskColor(ingredient.risk) }]}>
                      {getRiskLabel(ingredient.risk)}
                    </Text>
                  </View>
                  {ingredient.isControversial && (
                    <View style={styles.controversialBadge}>
                      <Feather name="alert-triangle" size={10} color={COLORS.warning} />
                      <Text style={styles.controversialText}>Controverse</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Additives card */}
          {hasAdditives && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="search" size={20} color={COLORS.primary} style={{ marginRight: SPACING.sm }} />
                <Text style={styles.cardTitle}>Additifs</Text>
                <View style={[styles.countBadge, { backgroundColor: COLORS.warningSoft }]}>
                  <Text style={[styles.countText, { color: COLORS.warning }]}>{additives.length}</Text>
                </View>
              </View>

              {additives.map((additive, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.additiveRow,
                    idx === additives.length - 1 && styles.lastRow,
                  ]}
                >
                  <View style={styles.additiveLeft}>
                    {additive.code ? (
                      <View style={[styles.additiveCodeBadge, { backgroundColor: getRiskBg(additive.risk) }]}>
                        <Text style={[styles.additiveCode, { color: getRiskColor(additive.risk) }]}>
                          {additive.code}
                        </Text>
                      </View>
                    ) : null}
                    <Text style={styles.additiveName} numberOfLines={1}>
                      {additive.name || 'Additif inconnu'}
                    </Text>
                  </View>
                  <View style={[styles.riskBadge, { backgroundColor: getRiskBg(additive.risk) }]}>
                    <View style={[styles.riskBadgeDot, { backgroundColor: getRiskColor(additive.risk) }]} />
                    <Text style={[styles.riskBadgeText, { color: getRiskColor(additive.risk) }]}>
                      {getRiskLabel(additive.risk)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Score details card */}
          {hasScoreDetails && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="clipboard" size={20} color={COLORS.primary} style={{ marginRight: SPACING.sm }} />
                <Text style={styles.cardTitle}>Details du score</Text>
              </View>

              {[
                { label: 'Proteines', value: product.scoreDetails.protein, icon: 'trending-up' },
                { label: 'Matieres grasses', value: product.scoreDetails.fat, icon: 'disc' },
                { label: 'Fibres', value: product.scoreDetails.fiber, icon: 'layers' },
                { label: 'Penalite additifs', value: product.scoreDetails.additivesPenalty != null ? -product.scoreDetails.additivesPenalty : null, icon: 'activity' },
                { label: 'Bonus qualite', value: product.scoreDetails.qualityBonus, icon: 'star' },
              ].filter(d => d.value != null).map((detail, idx, arr) => (
                <View
                  key={idx}
                  style={[
                    styles.detailRow,
                    idx === arr.length - 1 && styles.lastRow,
                  ]}
                >
                  <View style={styles.detailLeft}>
                    <Feather
                      name={detail.icon}
                      size={16}
                      color={COLORS.stone}
                    />
                    <Text style={styles.detailLabel}>{detail.label}</Text>
                  </View>
                  <View
                    style={[
                      styles.detailValueBadge,
                      {
                        backgroundColor: detail.value > 0
                          ? COLORS.successSoft
                          : detail.value < 0
                            ? COLORS.errorSoft
                            : COLORS.linen,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailValue,
                        {
                          color: detail.value > 0
                            ? COLORS.success
                            : detail.value < 0
                              ? COLORS.error
                              : COLORS.stone,
                        },
                      ]}
                    >
                      {detail.value > 0 ? '+' : ''}{detail.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* No data fallback */}
          {!hasIngredients && !hasAdditives && !hasBreakdown && !hasScoreDetails && (
            <View style={styles.noDataCard}>
              <View style={styles.noDataIconCircle}>
                <Feather name="inbox" size={36} color={COLORS.sand} />
              </View>
              <Text style={styles.noDataTitle}>Informations limitees</Text>
              <Text style={styles.noDataText}>
                Les details de ce produit ne sont pas encore disponibles dans notre base de donnees.
              </Text>
            </View>
          )}

          {/* Barcode info */}
          {product.barcode && (
            <View style={styles.barcodeInfo}>
              <Text style={styles.barcodeLabel}>Code-barres</Text>
              <Text style={styles.barcodeValue}>{product.barcode}</Text>
            </View>
          )}

          <View style={{ height: SPACING['3xl'] }} />
        </Animated.View>
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

  // Header gradient
  headerGradient: {
    paddingBottom: SPACING['3xl'],
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    borderBottomLeftRadius: RADIUS['3xl'],
    borderBottomRightRadius: RADIUS['3xl'],
  },

  // Nav
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: 2,
  },
  backText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.white,
    fontFamily: FONTS.bodySemiBold,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Product image
  productImage: { width: 80, height: 80, borderRadius: 16, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)', marginBottom: 12, alignSelf: 'center' },

  // Score badge
  scoreBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
  },
  scoreRingOuter: {
    position: 'absolute',
    width: SCORE_RING_SIZE + 22,
    height: SCORE_RING_SIZE + 22,
    borderRadius: (SCORE_RING_SIZE + 22) / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    borderStyle: 'dashed',
  },
  ringAccent: {
    position: 'absolute',
    top: -4,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  scoreCircle: {
    width: SCORE_RING_SIZE,
    height: SCORE_RING_SIZE,
    borderRadius: SCORE_RING_SIZE / 2,
    borderWidth: SCORE_RING_BORDER,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.xl,
  },
  scoreInner: {
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: FONT_SIZE['4xl'],
    fontFamily: FONTS.heading,
    color: COLORS.charcoal,
    letterSpacing: -1,
    lineHeight: FONT_SIZE['4xl'] + 2,
  },
  scoreNumberMuted: {
    color: COLORS.pebble,
    fontSize: FONT_SIZE['2xl'],
  },
  scoreMax: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.pebble,
    marginTop: -2,
  },

  // Score label
  scoreLabelBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.base,
  },
  scoreLabelText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Product info
  productName: {
    fontSize: FONT_SIZE['2xl'],
    fontFamily: FONTS.heading,
    color: COLORS.white,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  productBrand: {
    fontSize: FONT_SIZE.base,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: FONTS.bodyMedium,
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginTop: SPACING.xs,
  },
  categoryText: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: FONTS.bodySemiBold,
  },

  // Quick stats
  quickStats: {
    flexDirection: 'row',
    gap: SPACING.base,
    marginTop: SPACING.lg,
  },
  quickStat: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  quickStatValue: {
    fontSize: FONT_SIZE.lg,
    fontFamily: FONTS.heading,
    color: COLORS.white,
  },
  quickStatLabel: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },

  // Cards container
  cardsContainer: {
    paddingHorizontal: SPACING.xl,
    marginTop: -SPACING.lg,
  },

  // Card base
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    marginBottom: SPACING.base,
    ...SHADOWS.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontFamily: FONTS.heading,
    color: COLORS.charcoal,
  },
  countBadge: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  countText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.heading,
    color: COLORS.primary,
  },

  // Risk summary
  riskSummaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    ...SHADOWS.sm,
  },
  riskSummaryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  riskSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  riskSummaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  riskSummaryText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.heading,
  },

  // Score breakdown
  breakdownList: {
    gap: SPACING.lg,
  },
  breakdownItem: {
    gap: SPACING.xs,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.charcoal,
  },
  breakdownWeight: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.pebble,
    marginTop: 2,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.linen,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownValue: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.heading,
  },

  // Ingredients
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  riskDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.charcoal,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  ingredientRiskText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
  },
  controversialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningSoft,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    gap: 3,
  },
  controversialText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.warning,
    fontFamily: FONTS.heading,
  },

  // Additives
  additiveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  additiveLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginRight: SPACING.sm,
  },
  additiveCodeBadge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.sm,
  },
  additiveCode: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.heading,
    letterSpacing: 0.3,
  },
  additiveName: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.stone,
    fontFamily: FONTS.bodyMedium,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    gap: 5,
  },
  riskBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  riskBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.heading,
  },

  // Details
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  detailLabel: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.stone,
  },
  detailValueBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.sm,
    minWidth: 48,
    alignItems: 'center',
  },
  detailValue: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.heading,
  },

  // No data
  noDataCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS['2xl'],
    padding: SPACING['2xl'],
    alignItems: 'center',
    marginBottom: SPACING.base,
    ...SHADOWS.sm,
  },
  noDataIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.linen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
  },
  noDataTitle: {
    fontSize: FONT_SIZE.lg,
    fontFamily: FONTS.heading,
    color: COLORS.charcoal,
    marginBottom: SPACING.sm,
  },
  noDataText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.stone,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Barcode footer
  barcodeInfo: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    marginTop: SPACING.sm,
  },
  barcodeLabel: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.pebble,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  barcodeValue: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.stone,
    letterSpacing: 2,
  },
});

export default ProductResultScreen;
