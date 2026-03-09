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
const SCORE_RING_SIZE = 120;
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
  if (score >= 80) return ['#059669', '#34D399'];
  if (score >= 60) return ['#10B981', '#6EE7B7'];
  if (score >= 40) return ['#D97706', '#FCD34D'];
  if (score >= 20) return ['#EA580C', '#FDBA74'];
  return ['#DC2626', '#FCA5A5'];
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

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
  const slideUp = useRef(new Animated.Value(50)).current;
  const scoreScale = useRef(new Animated.Value(0.2)).current;
  const scoreOpacity = useRef(new Animated.Value(0)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const ringPulse = useRef(new Animated.Value(1)).current;
  const headerFade = useRef(new Animated.Value(0)).current;
  const [cardsVisible, setCardsVisible] = useState(false);
  const cardAnims = useRef([...Array(6)].map(() => new Animated.Value(0))).current;
  const cardSlides = useRef([...Array(6)].map(() => new Animated.Value(30))).current;

  // Button press scales
  const backScale = useRef(new Animated.Value(1)).current;
  const shareScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Header fade
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Content fade in
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // Score badge entrance with spring
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(scoreScale, {
          toValue: 1,
          friction: 5,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(scoreOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(ringRotate, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setCardsVisible(true);
      // Staggered card entrance
      Animated.stagger(100, cardAnims.map((anim, i) =>
        Animated.parallel([
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(cardSlides[i], {
            toValue: 0,
            friction: 8,
            tension: 60,
            useNativeDriver: true,
          }),
        ])
      )).start();
    });

    // Continuous subtle ring pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ringPulse, {
          toValue: 1.06,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(ringPulse, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, []);

  const handleShare = async () => {
    try {
      const scoreText = hasScore ? `Score Pépète: ${score}/100 (${scoreLabel})` : 'Score en cours d\'evaluation';
      await Share.share({
        message: `${product.name} (${product.brand || 'Marque inconnue'}) - ${scoreText}. Analyse sur Pépète!`,
      });
    } catch (_) {
      // Share cancelled
    }
  };

  const onButtonPressIn = (scaleRef) => {
    Animated.spring(scaleRef, { toValue: 0.9, friction: 8, tension: 100, useNativeDriver: true }).start();
  };
  const onButtonPressOut = (scaleRef) => {
    Animated.spring(scaleRef, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
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

  const renderCard = (content, index) => (
    <Animated.View
      key={index}
      style={{
        opacity: cardsVisible ? cardAnims[index] || 1 : 0,
        transform: [{ translateY: cardsVisible ? (cardSlides[index] || 0) : 30 }],
      }}
    >
      {content}
    </Animated.View>
  );

  let cardIndex = 0;

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
          colors={[scoreGradient[0], scoreGradient[1], scoreGradient[1] + 'CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { paddingTop: insets.top + SPACING.md }]}
        >
          {/* Decorative circles */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />

          {/* Nav bar */}
          <Animated.View style={[styles.headerNav, { opacity: headerFade }]}>
            <AnimatedTouchable
              style={[styles.backButton, { transform: [{ scale: backScale }] }]}
              onPress={() => navigation.goBack()}
              onPressIn={() => onButtonPressIn(backScale)}
              onPressOut={() => onButtonPressOut(backScale)}
              activeOpacity={1}
            >
              <View style={styles.navButtonGlass}>
                <Feather name="chevron-left" size={20} color={COLORS.white} />
                <Text style={styles.backText}>Retour</Text>
              </View>
            </AnimatedTouchable>
            <AnimatedTouchable
              style={[styles.shareButton, { transform: [{ scale: shareScale }] }]}
              onPress={handleShare}
              onPressIn={() => onButtonPressIn(shareScale)}
              onPressOut={() => onButtonPressOut(shareScale)}
              activeOpacity={1}
            >
              <View style={styles.navButtonGlassCircle}>
                <Feather name="share-2" size={17} color={COLORS.white} />
              </View>
            </AnimatedTouchable>
          </Animated.View>

          {/* Product image */}
          {product.image && (
            <View style={styles.productImageWrap}>
              <Image source={{ uri: product.image }} style={styles.productImage} />
            </View>
          )}

          {/* Score ring — Premium */}
          <Animated.View
            style={[
              styles.scoreBadgeContainer,
              {
                opacity: scoreOpacity,
                transform: [{ scale: scoreScale }],
              },
            ]}
          >
            {/* Pulsing outer ring */}
            <Animated.View
              style={[
                styles.scoreRingPulse,
                { transform: [{ scale: ringPulse }] },
              ]}
            />

            <Animated.View
              style={[
                styles.scoreRingOuter,
                { transform: [{ rotate: ringRotation }] },
              ]}
            >
              <View style={styles.ringAccent} />
              <View style={styles.ringAccent2} />
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

          {/* Score label pill — Glass */}
          <View style={styles.scoreLabelBadge}>
            <View style={styles.scoreLabelDot} />
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
              <Feather name="tag" size={11} color="rgba(255,255,255,0.8)" style={{ marginRight: 4 }} />
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          ) : null}

          {/* Quick stats row — Glass cards */}
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
                <View style={[styles.quickStat, styles.quickStatDanger]}>
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
          {hasBreakdown && renderCard(
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrap}>
                  <LinearGradient
                    colors={COLORS.gradientPrimary}
                    style={styles.cardIconGradient}
                  >
                    <Feather name="bar-chart-2" size={16} color={COLORS.white} />
                  </LinearGradient>
                </View>
                <Text style={styles.cardTitle}>Repartition du score</Text>
              </View>

              <View style={styles.breakdownList}>
                {[
                  { label: 'Ingredients', weight: '40%', value: ingredientScore ?? 0, maxValue: 40, color: COLORS.scoreExcellent, gradient: ['#059669', '#34D399'] },
                  { label: 'Additifs', weight: '30%', value: additivesScore ?? 0, maxValue: 30, color: COLORS.scoreMediocre, gradient: ['#D97706', '#FCD34D'] },
                  { label: 'Nutrition', weight: '30%', value: nutritionScoreDetail ?? 0, maxValue: 30, color: COLORS.info, gradient: ['#2563EB', '#60A5FA'] },
                ].map((item, index) => {
                  const pct = item.maxValue > 0 ? Math.min((item.value / item.maxValue) * 100, 100) : 0;
                  return (
                    <View key={index} style={styles.breakdownItem}>
                      <View style={styles.breakdownLabelRow}>
                        <Text style={styles.breakdownLabel}>{item.label}</Text>
                        <View style={[styles.breakdownValueBadge, { backgroundColor: item.color + '15' }]}>
                          <Text style={[styles.breakdownValue, { color: item.color }]}>
                            {item.value}/{item.maxValue}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.progressBarBg}>
                        <LinearGradient
                          colors={item.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[
                            styles.progressBarFill,
                            { width: `${Math.max(pct, 2)}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.breakdownWeight}>Poids: {item.weight}</Text>
                    </View>
                  );
                })}
              </View>
            </View>,
            cardIndex++
          )}

          {/* Ingredients summary bar */}
          {hasIngredients && (dangerousCount > 0 || moderateCount > 0) && renderCard(
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
            </View>,
            cardIndex++
          )}

          {/* Ingredients card */}
          {hasIngredients && renderCard(
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrap}>
                  <LinearGradient
                    colors={['#059669', '#34D399']}
                    style={styles.cardIconGradient}
                  >
                    <Feather name="droplet" size={16} color={COLORS.white} />
                  </LinearGradient>
                </View>
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
            </View>,
            cardIndex++
          )}

          {/* Additives card */}
          {hasAdditives && renderCard(
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrap}>
                  <LinearGradient
                    colors={['#D97706', '#FCD34D']}
                    style={styles.cardIconGradient}
                  >
                    <Feather name="search" size={16} color={COLORS.white} />
                  </LinearGradient>
                </View>
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
            </View>,
            cardIndex++
          )}

          {/* Score details card */}
          {hasScoreDetails && renderCard(
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrap}>
                  <LinearGradient
                    colors={COLORS.gradientAccent}
                    style={styles.cardIconGradient}
                  >
                    <Feather name="clipboard" size={16} color={COLORS.white} />
                  </LinearGradient>
                </View>
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
                    <View style={styles.detailIconWrap}>
                      <Feather
                        name={detail.icon}
                        size={14}
                        color={COLORS.stone}
                      />
                    </View>
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
            </View>,
            cardIndex++
          )}

          {/* No data fallback */}
          {!hasIngredients && !hasAdditives && !hasBreakdown && !hasScoreDetails && renderCard(
            <View style={styles.noDataCard}>
              <View style={styles.noDataIconCircle}>
                <Feather name="inbox" size={36} color={COLORS.sand} />
              </View>
              <Text style={styles.noDataTitle}>Informations limitees</Text>
              <Text style={styles.noDataText}>
                Les details de ce produit ne sont pas encore disponibles dans notre base de donnees.
              </Text>
            </View>,
            cardIndex++
          )}

          {/* Barcode info — Premium */}
          {product.barcode && (
            <View style={styles.barcodeInfo}>
              <View style={styles.barcodeDivider} />
              <Text style={styles.barcodeLabel}>Code-barres</Text>
              <View style={styles.barcodeValueWrap}>
                <Feather name="maximize" size={12} color={COLORS.pebble} style={{ marginRight: 6 }} />
                <Text style={styles.barcodeValue}>{product.barcode}</Text>
              </View>
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

  // Header gradient — Premium
  headerGradient: {
    paddingBottom: SPACING['3xl'] + 8,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    borderBottomLeftRadius: RADIUS['3xl'] + 4,
    borderBottomRightRadius: RADIUS['3xl'] + 4,
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: 20,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },

  // Nav — Premium glass
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING.xl,
  },
  backButton: {},
  navButtonGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.white,
    fontFamily: FONTS.bodySemiBold,
  },
  shareButton: {},
  navButtonGlassCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  // Product image — Premium
  productImageWrap: {
    marginBottom: SPACING.base,
    borderRadius: 20,
    ...SHADOWS.lg,
  },
  productImage: {
    width: 88,
    height: 88,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
  },

  // Score badge — Premium
  scoreBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  scoreRingPulse: {
    position: 'absolute',
    width: SCORE_RING_SIZE + 36,
    height: SCORE_RING_SIZE + 36,
    borderRadius: (SCORE_RING_SIZE + 36) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  scoreRingOuter: {
    position: 'absolute',
    width: SCORE_RING_SIZE + 24,
    height: SCORE_RING_SIZE + 24,
    borderRadius: (SCORE_RING_SIZE + 24) / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
  ringAccent: {
    position: 'absolute',
    top: -5,
    left: '50%',
    marginLeft: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  ringAccent2: {
    position: 'absolute',
    bottom: -5,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  scoreCircle: {
    width: SCORE_RING_SIZE,
    height: SCORE_RING_SIZE,
    borderRadius: SCORE_RING_SIZE / 2,
    borderWidth: SCORE_RING_BORDER,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.xl,
  },
  scoreInner: {
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: FONT_SIZE['4xl'] + 2,
    fontFamily: FONTS.heading,
    color: COLORS.charcoal,
    letterSpacing: -1.5,
    lineHeight: FONT_SIZE['4xl'] + 4,
  },
  scoreNumberMuted: {
    color: COLORS.pebble,
    fontSize: FONT_SIZE['2xl'],
  },
  scoreMax: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.pebble,
    marginTop: -1,
    letterSpacing: 0.5,
  },

  // Score label — Glass
  scoreLabelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.base,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 6,
  },
  scoreLabelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  scoreLabelText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Product info
  productName: {
    fontSize: FONT_SIZE['2xl'] + 2,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  productBrand: {
    fontSize: FONT_SIZE.base,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: FONTS.bodyMedium,
    marginBottom: SPACING.sm,
    letterSpacing: 0.2,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.full,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  categoryText: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: FONTS.bodySemiBold,
  },

  // Quick stats — Glass
  quickStats: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  quickStat: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minWidth: 80,
  },
  quickStatDanger: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderColor: 'rgba(220, 38, 38, 0.1)',
  },
  quickStatValue: {
    fontSize: FONT_SIZE.xl,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  quickStatLabel: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  // Cards container
  cardsContainer: {
    paddingHorizontal: SPACING.xl,
    marginTop: -SPACING.lg,
  },

  // Card base — Premium
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS['2xl'] + 2,
    padding: SPACING.xl,
    marginBottom: SPACING.base,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  cardIconWrap: {
    marginRight: SPACING.sm + 2,
  },
  cardIconGradient: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontFamily: FONTS.heading,
    color: COLORS.charcoal,
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.full,
  },
  countText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.heading,
    color: COLORS.primary,
  },

  // Risk summary — Premium
  riskSummaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.base,
    marginBottom: SPACING.base,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
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
    paddingVertical: SPACING.sm + 1,
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

  // Score breakdown — Premium
  breakdownList: {
    gap: SPACING.lg + 2,
  },
  breakdownItem: {
    gap: SPACING.xs + 1,
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
  breakdownValueBadge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.linen,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  breakdownValue: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.heading,
    letterSpacing: 0.2,
  },

  // Ingredients — Premium
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  riskDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    marginBottom: 3,
  },
  ingredientRiskText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
  },
  controversialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningSoft,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  controversialText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.warning,
    fontFamily: FONTS.heading,
  },

  // Additives — Premium
  additiveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md + 2,
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

  // Details — Premium
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  detailIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.linen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.stone,
  },
  detailValueBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    minWidth: 52,
    alignItems: 'center',
  },
  detailValue: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.heading,
    letterSpacing: 0.3,
  },

  // No data — Premium
  noDataCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS['2xl'] + 2,
    padding: SPACING['2xl'] + 4,
    alignItems: 'center',
    marginBottom: SPACING.base,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  noDataIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    lineHeight: 21,
  },

  // Barcode footer — Premium
  barcodeInfo: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginTop: SPACING.sm,
  },
  barcodeDivider: {
    width: 40,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.base,
  },
  barcodeLabel: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.pebble,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  barcodeValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.linen,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  barcodeValue: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.stone,
    letterSpacing: 2.5,
  },
});

export default ProductResultScreen;
