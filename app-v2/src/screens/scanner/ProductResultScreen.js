import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  Share,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS } from '../../utils/typography';
import { COLORS, SHADOWS, RADIUS, SPACING, FONT_SIZE, getScoreColor, getScoreBg, getScoreLabel } from '../../utils/colors';
import { showAlert } from '../../utils/alert';

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
  if (score >= 80) return [COLORS.scoreExcellent, '#6B8F71'];
  if (score >= 60) return [COLORS.scoreGood, '#8CB092'];
  if (score >= 40) return [COLORS.scoreMediocre, '#D4AD86'];
  if (score >= 20) return [COLORS.scoreBad, '#C4956A'];
  return [COLORS.scoreVeryBad, '#B86B4A'];
};

const DETAIL_ICONS = {
  protein: 'trending-up',
  fat: 'disc',
  fiber: 'layers',
  additivesPenalty: 'activity',
  qualityBonus: 'star',
};

/**
 * Génère des conseils personnalisés en fonction du produit scanné
 */
const getPersonalizedAdvice = (product) => {
  const advice = [];
  const score = product.nutritionScore ?? 50;
  const ingredients = product.ingredients || [];
  const additives = product.additives || [];
  const details = product.scoreDetails || {};
  const dangerousIngs = ingredients.filter(i => i.risk === 'dangerous');
  const dangerousAdds = additives.filter(a => a.risk === 'dangerous');
  const targetAnimal = (product.targetAnimal || ['tous'])[0];
  const animalName = targetAnimal === 'chien' ? 'votre chien' :
    targetAnimal === 'chat' ? 'votre chat' : 'votre animal';

  if (score >= 80) {
    advice.push({ icon: 'award', title: 'Excellent choix !', text: `Ce produit est de tres bonne qualite pour ${animalName}. Vous pouvez le donner en toute confiance.`, type: 'success' });
  } else if (score >= 60) {
    advice.push({ icon: 'thumbs-up', title: 'Bon produit', text: `Ce produit est correct pour ${animalName}, mais il existe des alternatives encore meilleures.`, type: 'info' });
  } else if (score >= 40) {
    advice.push({ icon: 'alert-circle', title: 'Qualite moyenne', text: `Ce produit contient des ingredients discutables. Privilegiez des produits avec un score superieur a 60.`, type: 'warning' });
  } else {
    advice.push({ icon: 'alert-triangle', title: 'Produit deconseille', text: `Ce produit est de mauvaise qualite pour ${animalName}. Nous recommandons de chercher une meilleure alternative.`, type: 'error' });
  }

  if (dangerousIngs.length > 0) {
    const names = dangerousIngs.slice(0, 3).map(i => i.name).join(', ');
    advice.push({ icon: 'x-circle', title: 'Ingredients a risque detectes', text: `Ce produit contient : ${names}. Ces ingredients peuvent etre nocifs a long terme. Verifiez aupres de votre veterinaire.`, type: 'error' });
  }

  if (dangerousAdds.length > 0) {
    advice.push({ icon: 'slash', title: `${dangerousAdds.length} additif${dangerousAdds.length > 1 ? 's' : ''} dangereux`, text: `Les additifs comme ${dangerousAdds[0].name || dangerousAdds[0].code} sont controverses et potentiellement cancerigenes. Evitez les produits qui en contiennent.`, type: 'error' });
  }

  if (details.protein != null) {
    if (details.protein >= 5) {
      advice.push({ icon: 'trending-up', title: 'Riche en proteines', text: targetAnimal === 'chat' ? 'Les chats sont des carnivores stricts et ont besoin d\'un apport eleve en proteines. Ce produit repond bien a ce besoin.' : 'Bon apport en proteines animales, essentiel pour la masse musculaire et l\'energie.', type: 'success' });
    } else if (details.protein <= 0 && score < 70) {
      advice.push({ icon: 'trending-down', title: 'Faible en proteines', text: `${animalName.charAt(0).toUpperCase() + animalName.slice(1)} a besoin de proteines animales de qualite. Cherchez un produit avec de la vraie viande en premier ingredient.`, type: 'warning' });
    }
  }

  if (details.fat != null && details.fat < 0) {
    advice.push({ icon: 'disc', title: 'Taux de gras eleve', text: `Un exces de matieres grasses peut entrainer de l'obesite et des problemes pancreatiques. A donner avec moderation.`, type: 'warning' });
  }

  if (details.fiber != null && details.fiber >= 3) {
    advice.push({ icon: 'layers', title: 'Bon apport en fibres', text: 'Les fibres favorisent une bonne digestion et un transit regulier. Excellent point pour ce produit.', type: 'success' });
  }

  if (ingredients.length > 0) {
    const firstName = (ingredients[0].name || '').toLowerCase();
    const isMeat = ['viande', 'poulet', 'saumon', 'dinde', 'agneau', 'poisson', 'boeuf', 'canard', 'thon'].some(m => firstName.includes(m));
    if (isMeat) {
      advice.push({ icon: 'check-circle', title: 'Viande en 1er ingredient', text: 'Le premier ingredient est une source de proteine animale, signe d\'un produit de qualite superieure.', type: 'success' });
    } else if (score < 70) {
      const isCereal = ['mais', 'ble', 'cereale', 'riz', 'amidon', 'farine'].some(c => firstName.includes(c));
      if (isCereal) {
        advice.push({ icon: 'info', title: 'Cereales en 1er ingredient', text: 'Le premier ingredient est une cereale, pas une proteine animale. Les animaux carnivores digerent mal les cereales en grande quantite.', type: 'warning' });
      }
    }
  }

  if (targetAnimal === 'chat' && score >= 50) {
    advice.push({ icon: 'droplet', title: 'Hydratation du chat', text: 'Les chats boivent naturellement peu. Alternez croquettes et patee pour assurer une bonne hydratation.', type: 'info' });
  }
  if (targetAnimal === 'chien' && score >= 50) {
    advice.push({ icon: 'clock', title: 'Conseil de distribution', text: 'Divisez la ration quotidienne en 2 repas. Evitez l\'exercice intense 1h apres le repas pour prevenir la torsion d\'estomac.', type: 'info' });
  }

  return advice;
};

const getAdviceColors = (type) => {
  switch (type) {
    case 'success': return { bg: COLORS.successSoft || '#E8F5E9', color: COLORS.success || '#2E7D32', icon: COLORS.scoreExcellent };
    case 'error': return { bg: COLORS.errorSoft || '#FFEBEE', color: COLORS.error || '#C62828', icon: COLORS.scoreVeryBad };
    case 'warning': return { bg: COLORS.warningSoft || '#FFF8E1', color: COLORS.warning || '#F57F17', icon: COLORS.scoreMediocre };
    default: return { bg: COLORS.primarySoft || '#E3F2FD', color: COLORS.primary || '#1565C0', icon: COLORS.info || '#1976D2' };
  }
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

  const getShareEmoji = (s) => {
    if (s >= 80) return '🟢';
    if (s >= 60) return '🟡';
    if (s >= 40) return '🟠';
    return '🔴';
  };

  const buildShareMessage = () => {
    const emoji = hasScore ? getShareEmoji(score) : '🔍';
    const brandText = product.brand ? ` de ${product.brand}` : '';
    const dangerousIngs = (product.ingredients || []).filter(i => i.risk === 'dangerous');
    const ingredientWarning = dangerousIngs.length > 0
      ? `\n⚠️ ${dangerousIngs.length} ingredient${dangerousIngs.length > 1 ? 's' : ''} a risque detecte${dangerousIngs.length > 1 ? 's' : ''} !`
      : '';

    if (!hasScore) {
      return `🐾 J'ai scanne ${product.name}${brandText} sur Pepete !${ingredientWarning}\n\nScanne les croquettes de ton animal ➡️ pepete.fr`;
    }

    const verdict = score >= 80
      ? '✅ Excellent choix pour mon animal !'
      : score >= 60
        ? '👍 Pas mal, mais il y a mieux'
        : score >= 40
          ? '⚠️ Qualite moyenne... a changer ?'
          : '🚫 Deconseille ! Je cherche une alternative';

    return `${emoji} ${product.name}${brandText} → ${score}/100 sur Pepete !\n\n${verdict}${ingredientWarning}\n\n🐾 Et toi, tu sais ce que mange ton animal ?\nScanne ses croquettes ➡️ pepete.fr`;
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: buildShareMessage(),
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

  const advice = getPersonalizedAdvice(product);
  const targetAnimalLabels = {
    chien: 'Chien', chat: 'Chat', rongeur: 'Rongeur',
    oiseau: 'Oiseau', reptile: 'Reptile', poisson: 'Poisson', tous: 'Tous animaux',
  };
  const targetAnimals = (product.targetAnimal || []).map(a => targetAnimalLabels[a] || a);

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
                  <Text style={[styles.quickStatValue, { color: '#FBE8E4' }]}>{dangerousCount}</Text>
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

          {/* Product info card */}
          {(product.brand || targetAnimals.length > 0 || product.category) && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="info" size={20} color={COLORS.primary} style={{ marginRight: SPACING.sm }} />
                <Text style={styles.cardTitle}>Informations produit</Text>
              </View>
              {[
                product.brand && { label: 'Marque', value: product.brand, icon: 'tag' },
                product.category && { label: 'Categorie', value: product.category.charAt(0).toUpperCase() + product.category.slice(1), icon: 'grid' },
                targetAnimals.length > 0 && { label: 'Animal cible', value: targetAnimals.join(', '), icon: 'heart' },
                product.barcode && { label: 'Code-barres', value: product.barcode, icon: 'hash' },
              ].filter(Boolean).map((item, idx, arr) => (
                <View key={idx} style={[styles.detailRow, idx === arr.length - 1 && styles.lastRow]}>
                  <View style={styles.detailLeft}>
                    <Feather name={item.icon} size={16} color={COLORS.stone} />
                    <Text style={styles.detailLabel}>{item.label}</Text>
                  </View>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Personalized advice card */}
          {advice.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="message-circle" size={20} color={COLORS.primary} style={{ marginRight: SPACING.sm }} />
                <Text style={styles.cardTitle}>Conseils personnalises</Text>
              </View>
              {advice.map((item, idx) => {
                const colors = getAdviceColors(item.type);
                return (
                  <View
                    key={idx}
                    style={[
                      styles.adviceItem,
                      { backgroundColor: colors.bg },
                      idx === advice.length - 1 && { marginBottom: 0 },
                    ]}
                  >
                    <View style={[styles.adviceIconCircle, { backgroundColor: colors.color + '20' }]}>
                      <Feather name={item.icon} size={18} color={colors.icon} />
                    </View>
                    <View style={styles.adviceContent}>
                      <Text style={[styles.adviceTitle, { color: colors.color }]}>{item.title}</Text>
                      <Text style={styles.adviceText}>{item.text}</Text>
                    </View>
                  </View>
                );
              })}
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

          {/* Share score card - Growth Hacking #1 */}
          <View style={styles.shareCard}>
            <LinearGradient
              colors={hasScore ? getScoreGradient(score) : [COLORS.pebble, COLORS.sand]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shareCardGradient}
            >
              <View style={styles.shareCardPreview}>
                <View style={styles.shareMiniScore}>
                  <Text style={styles.shareMiniScoreText}>{displayScore}</Text>
                  {hasScore && <Text style={styles.shareMiniScoreMax}>/100</Text>}
                </View>
                <View style={styles.shareCardPreviewInfo}>
                  <Text style={styles.shareCardProductName} numberOfLines={1}>
                    {product.name || 'Produit inconnu'}
                  </Text>
                  <Text style={styles.shareCardVerdict}>
                    {hasScore ? scoreLabel : 'Non evalue'}
                  </Text>
                </View>
              </View>

              <Text style={styles.shareCardQuestion}>
                Et toi, tu sais ce que mange ton animal ?
              </Text>

              <TouchableOpacity
                style={styles.shareCardButton}
                onPress={handleShare}
                activeOpacity={0.85}
              >
                <Feather name="share-2" size={18} color={hasScore ? getScoreColor(score) : COLORS.pebble} />
                <Text style={[styles.shareCardButtonText, { color: hasScore ? getScoreColor(score) : COLORS.pebble }]}>
                  Partager le resultat
                </Text>
              </TouchableOpacity>

              <Text style={styles.shareCardFooter}>pepete.fr</Text>
            </LinearGradient>
          </View>

          <View style={{ height: SPACING['3xl'] }} />
        </Animated.View>
      </ScrollView>

      {/* Sticky engagement bar */}
      <View style={[styles.engagementBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={styles.engageScanBtn}
          onPress={() => navigation.replace('ScannerMain')}
          activeOpacity={0.85}
        >
          <Feather name="camera" size={18} color={COLORS.primary} />
          <Text style={styles.engageScanText}>Scanner un autre</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.engageShareBtn, { backgroundColor: hasScore ? getScoreColor(score) : COLORS.pebble }]}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Feather name="share-2" size={18} color="#FFF" />
          <Text style={styles.engageShareText}>Partager</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 80,
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

  // Product info value
  infoValue: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.charcoal,
    maxWidth: '55%',
    textAlign: 'right',
  },

  // Personalized advice
  adviceItem: {
    flexDirection: 'row',
    padding: SPACING.base,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  adviceIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  adviceContent: {
    flex: 1,
  },
  adviceTitle: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.heading,
    marginBottom: 3,
  },
  adviceText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.stone,
    lineHeight: 18,
  },

  // Share card
  shareCard: {
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    marginBottom: SPACING.base,
    ...SHADOWS.lg,
  },
  shareCardGradient: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  shareCardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    width: '100%',
    marginBottom: SPACING.lg,
  },
  shareMiniScore: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    ...SHADOWS.sm,
  },
  shareMiniScoreText: {
    fontSize: FONT_SIZE.xl,
    fontFamily: FONTS.heading,
    color: COLORS.charcoal,
    lineHeight: FONT_SIZE.xl + 2,
  },
  shareMiniScoreMax: {
    fontSize: 9,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.pebble,
    marginTop: -3,
  },
  shareCardPreviewInfo: {
    flex: 1,
  },
  shareCardProductName: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    marginBottom: 2,
  },
  shareCardVerdict: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  shareCardQuestion: {
    fontSize: FONT_SIZE.lg,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: FONT_SIZE.lg + 6,
  },
  shareCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.full,
    gap: SPACING.sm,
    width: '100%',
    ...SHADOWS.md,
  },
  shareCardButtonText: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.heading,
    letterSpacing: 0.2,
  },
  shareCardFooter: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodySemiBold,
    color: 'rgba(255,255,255,0.6)',
    marginTop: SPACING.md,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Engagement bar
  engagementBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.cream,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.lg,
  },
  engageScanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '30',
  },
  engageScanText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.heading,
    color: COLORS.primary,
  },
  engageShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.xl,
  },
  engageShareText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.heading,
    color: '#FFF',
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
