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
import { hapticSuccess, hapticWarning, hapticError, hapticLight } from '../../utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAlternativesAPI, toggleFavoriteAPI } from '../../api/products';
import { useAuth } from '../../context/AuthContext';
import BadgeUnlockModal from '../../components/BadgeUnlockModal';
import Confetti from '../../components/Confetti';
import ShareNudgeModal from '../../components/ShareNudgeModal';
import ExtremeScoreSharePrompt from '../../components/ExtremeScoreSharePrompt';

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
    advice.push({ icon: 'award', title: 'Excellent choix !', text: `Ce produit est de très bonne qualité pour ${animalName}. Vous pouvez le donner en toute confiance.`, type: 'success' });
  } else if (score >= 60) {
    advice.push({ icon: 'thumbs-up', title: 'Bon produit', text: `Ce produit est correct pour ${animalName}, mais il existe des alternatives encore meilleures.`, type: 'info' });
  } else if (score >= 40) {
    advice.push({ icon: 'alert-circle', title: 'Qualité moyenne', text: `Ce produit contient des ingrédients discutables. Privilégiez des produits avec un score supérieur à 60.`, type: 'warning' });
  } else {
    advice.push({ icon: 'alert-triangle', title: 'Produit déconseillé', text: `Ce produit est de mauvaise qualité pour ${animalName}. Nous recommandons de chercher une meilleure alternative.`, type: 'error' });
  }

  if (dangerousIngs.length > 0) {
    const names = dangerousIngs.slice(0, 3).map(i => i.name).join(', ');
    advice.push({ icon: 'x-circle', title: 'Ingrédients à risque détectés', text: `Ce produit contient : ${names}. Ces ingrédients peuvent être nocifs à long terme. Demandez conseil à votre vétérinaire.`, type: 'error' });
  }

  if (dangerousAdds.length > 0) {
    advice.push({ icon: 'slash', title: `${dangerousAdds.length} additif${dangerousAdds.length > 1 ? 's' : ''} dangereux`, text: `Les additifs comme ${dangerousAdds[0].name || dangerousAdds[0].code} sont controversés et potentiellement cancérigènes. Évitez les produits qui en contiennent.`, type: 'error' });
  }

  if (details.protein != null) {
    if (details.protein >= 5) {
      advice.push({ icon: 'trending-up', title: 'Riche en protéines', text: targetAnimal === 'chat' ? 'Les chats sont des carnivores stricts et ont besoin d\'un apport élevé en protéines. Ce produit répond bien à ce besoin.' : 'Bon apport en protéines animales, essentiel pour la masse musculaire et l\'énergie.', type: 'success' });
    } else if (details.protein <= 0 && score < 70) {
      advice.push({ icon: 'trending-down', title: 'Faible en protéines', text: `${animalName.charAt(0).toUpperCase() + animalName.slice(1)} a besoin de protéines animales de qualité. Cherchez un produit avec de la vraie viande en premier ingrédient.`, type: 'warning' });
    }
  }

  if (details.fat != null && details.fat < 0) {
    advice.push({ icon: 'disc', title: 'Taux de gras élevé', text: `Un excès de matières grasses peut entraîner de l'obésité et des problèmes pancréatiques. À donner avec modération.`, type: 'warning' });
  }

  if (details.fiber != null && details.fiber >= 3) {
    advice.push({ icon: 'layers', title: 'Bon apport en fibres', text: 'Les fibres favorisent une bonne digestion et un transit régulier. Excellent point pour ce produit.', type: 'success' });
  }

  if (ingredients.length > 0) {
    const firstName = (ingredients[0].name || '').toLowerCase();
    const isMeat = ['viande', 'poulet', 'saumon', 'dinde', 'agneau', 'poisson', 'boeuf', 'canard', 'thon'].some(m => firstName.includes(m));
    if (isMeat) {
      advice.push({ icon: 'check-circle', title: 'Viande en 1er ingrédient', text: 'Le premier ingrédient est une source de protéine animale, signe d\'un produit de qualité supérieure.', type: 'success' });
    } else if (score < 70) {
      const isCereal = ['mais', 'ble', 'céréale', 'riz', 'amidon', 'farine'].some(c => firstName.includes(c));
      if (isCereal) {
        advice.push({ icon: 'info', title: 'Céréales en 1er ingrédient', text: 'Le premier ingrédient est une céréale, pas une protéine animale. Les animaux carnivores digèrent mal les céréales en grande quantité.', type: 'warning' });
      }
    }
  }

  if (targetAnimal === 'chat' && score >= 50) {
    advice.push({ icon: 'droplet', title: 'Hydratation du chat', text: 'Les chats boivent naturellement peu. Alternez croquettes et pâtée pour assurer une bonne hydratation.', type: 'info' });
  }
  if (targetAnimal === 'chien' && score >= 50) {
    advice.push({ icon: 'clock', title: 'Conseil de distribution', text: 'Divisez la ration quotidienne en 2 repas. Évitez l\'exercice intense 1h après le repas pour prévenir la torsion d\'estomac.', type: 'info' });
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
  const { user, updateUser } = useAuth();
  const { product, newBadges: newBadgesParam, gamification } = route.params;
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
  const [badgeModal, setBadgeModal] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showShareNudge, setShowShareNudge] = useState(false);
  const [showExtremeShare, setShowExtremeShare] = useState(false);
  const badgeQueue = useRef([...(newBadgesParam || [])]).current;

  // Favorite state
  const [isFavorite, setIsFavorite] = useState(
    (user?.favoriteProducts || []).some(id => id === product._id || id?._id === product._id)
  );
  const favScale = useRef(new Animated.Value(1)).current;

  const handleToggleFavorite = async () => {
    if (!user) {
      showAlert('Connecte-toi', 'Connecte-toi pour sauvegarder des produits favoris.');
      return;
    }
    if (!product._id) return;
    hapticLight();
    // Optimistic update + bump animation
    setIsFavorite(f => !f);
    Animated.sequence([
      Animated.spring(favScale, { toValue: 1.3, friction: 3, tension: 150, useNativeDriver: true }),
      Animated.spring(favScale, { toValue: 1, friction: 3, tension: 150, useNativeDriver: true }),
    ]).start();
    try {
      const res = await toggleFavoriteAPI(product._id);
      setIsFavorite(!!res.data?.isFavorite);
      // Update local user
      if (updateUser) {
        const currentFavs = user.favoriteProducts || [];
        const newFavs = res.data?.isFavorite
          ? [...currentFavs, product._id]
          : currentFavs.filter(id => id !== product._id && id?._id !== product._id);
        updateUser({ ...user, favoriteProducts: newFavs });
      }
    } catch (_) {
      setIsFavorite(f => !f); // rollback
    }
  };

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
    ]).start(() => {
      setCardsVisible(true);
      // Show badge unlock after animation
      if (badgeQueue.length > 0) {
        setTimeout(() => setBadgeModal(badgeQueue.shift()), 800);
      }
    });

    // Haptic feedback based on score quality
    if (hasScore) {
      setTimeout(() => {
        if (score >= 80) {
          hapticSuccess();
          // Celebrate with confetti on great products!
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 4000);
        } else if (score >= 40) {
          hapticLight();
        } else {
          hapticWarning();
        }
      }, 400);
    } else {
      hapticLight();
    }

    // Extreme score share prompt (score < 20 or > 85) — high viral potential
    if (hasScore && (score >= 85 || score < 20) && gamification?.totalScans !== 1) {
      setTimeout(() => setShowExtremeShare(true), 4000);
    }

    // First scan share nudge — show once ever, 3s after result
    if (user && gamification?.totalScans === 1) {
      AsyncStorage.getItem('share_nudge_shown').then(v => {
        if (!v) {
          setTimeout(() => setShowShareNudge(true), 3000);
          AsyncStorage.setItem('share_nudge_shown', 'true');
        }
      }).catch(() => {});
    }

    // Fetch alternatives for low-score products
    if (hasScore && score < 60 && product._id) {
      getAlternativesAPI(product._id).then(res => {
        if (res.data?.alternatives?.length > 0) {
          setAlternatives(res.data.alternatives);
        }
      }).catch(() => {});
    }
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
      ? `\n⚠️ ${dangerousIngs.length} ingrédient${dangerousIngs.length > 1 ? 's' : ''} a risque détecté${dangerousIngs.length > 1 ? 's' : ''} !`
      : '';

    if (!hasScore) {
      const link = product.barcode ? `pepete.fr/scan/${product.barcode}` : 'pepete.fr';
      return `🐾 J'ai scanne ${product.name}${brandText} sur Pepete !${ingredientWarning}\n\nScanne les croquettes de ton animal ➡️ ${link}`;
    }

    const verdict = score >= 80
      ? '✅ Excellent choix pour mon animal !'
      : score >= 60
        ? '👍 Pas mal, mais il y a mieux'
        : score >= 40
          ? '⚠️ Qualite moyenne... a changer ?'
          : '🚫 Deconseille ! Je cherche une alternative';

    const productLink = product.barcode ? `pepete.fr/scan/${product.barcode}` : 'pepete.fr';
    return `${emoji} ${product.name}${brandText} → ${score}/100 sur Pepete !\n\n${verdict}${ingredientWarning}\n\n🐾 Et toi, tu sais ce que mange ton animal ?\nVoir le resultat ➡️ ${productLink}`;
  };

  const handleShare = async () => {
    hapticLight();
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

  // Pro-grade nutritionist analysis fields (v3 scoreCalculator)
  const sd = product.scoreDetails || {};
  const kcalPer100g = sd.kcalPer100g || 0;
  const carbsPct = sd.carbs || 0;
  const proteinPct = sd.protein || 0;
  const fatPct = sd.fat || 0;
  const fiberPct = sd.fiber || 0;
  const allergensList = Array.isArray(sd.allergens) ? sd.allergens : [];
  const positiveMarkers = Array.isArray(sd.positiveMarkers) ? sd.positiveMarkers : [];
  const lifeStageWarnings = Array.isArray(sd.lifeStageWarnings) ? sd.lifeStageWarnings : [];
  const marketingTricks = Array.isArray(sd.marketingTricks) ? sd.marketingTricks : [];
  const fediafMet = sd.fediafMet || { protein: true, fat: true };
  const hasNutritionFacts = kcalPer100g > 0 || proteinPct > 0 || fatPct > 0;
  const hasAllergens = allergensList.length > 0;
  const hasPositiveMarkers = positiveMarkers.length > 0;
  const hasLifeStageWarnings = lifeStageWarnings.length > 0;
  const hasMarketingTricks = marketingTricks.length > 0;

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
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              {user && (
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={handleToggleFavorite}
                  activeOpacity={0.7}
                >
                  <Animated.View style={{ transform: [{ scale: favScale }] }}>
                    <Feather
                      name="heart"
                      size={18}
                      color={isFavorite ? '#FF5C7A' : COLORS.white}
                      style={isFavorite ? { } : undefined}
                    />
                  </Animated.View>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <Feather name="share-2" size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>
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
                  { label: 'Ingrédients', weight: '40%', value: ingredientScore ?? 0, maxValue: 40, color: COLORS.scoreExcellent },
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

          {/* Life-stage warnings — CRITICAL card shown first when present */}
          {hasLifeStageWarnings && (
            <View style={[styles.card, styles.criticalCard]}>
              <View style={styles.cardHeader}>
                <Feather name="alert-octagon" size={20} color={COLORS.scoreVeryBad} style={{ marginRight: SPACING.sm }} />
                <Text style={[styles.cardTitle, { color: COLORS.scoreVeryBad }]}>Alertes nutritionniste</Text>
              </View>
              <Text style={styles.criticalIntro}>
                Notre analyse a identifié des points critiques pour la santé de votre animal :
              </Text>
              {lifeStageWarnings.map((warning, idx) => (
                <View key={idx} style={styles.criticalItem}>
                  <View style={styles.criticalBullet}>
                    <Feather name="alert-triangle" size={14} color={COLORS.scoreVeryBad} />
                  </View>
                  <Text style={styles.criticalText}>{warning}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Nutrition facts card (kcal + macros) */}
          {hasNutritionFacts && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="pie-chart" size={20} color={COLORS.primary} style={{ marginRight: SPACING.sm }} />
                <Text style={styles.cardTitle}>Analyse nutritionnelle</Text>
              </View>

              {kcalPer100g > 0 && (
                <View style={styles.kcalHero}>
                  <Text style={styles.kcalValue}>{kcalPer100g}</Text>
                  <View>
                    <Text style={styles.kcalUnit}>kcal / 100 g</Text>
                    <Text style={styles.kcalSubtext}>Energie metabolisable (Atwater modifie)</Text>
                  </View>
                </View>
              )}

              <View style={styles.macroGrid}>
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Proteines</Text>
                  <Text style={[styles.macroValue, !fediafMet.protein && { color: COLORS.scoreVeryBad }]}>
                    {proteinPct.toFixed(1)}%
                  </Text>
                  {!fediafMet.protein && (
                    <Text style={styles.macroFlag}>sous FEDIAF</Text>
                  )}
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Lipides</Text>
                  <Text style={[styles.macroValue, !fediafMet.fat && { color: COLORS.scoreVeryBad }]}>
                    {fatPct.toFixed(1)}%
                  </Text>
                  {!fediafMet.fat && (
                    <Text style={styles.macroFlag}>sous FEDIAF</Text>
                  )}
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Fibres</Text>
                  <Text style={styles.macroValue}>{fiberPct.toFixed(1)}%</Text>
                </View>
                {carbsPct > 0 && (
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>Glucides</Text>
                    <Text style={[
                      styles.macroValue,
                      carbsPct > 45 && { color: COLORS.scoreMediocre },
                      carbsPct > 55 && { color: COLORS.scoreVeryBad },
                    ]}>{carbsPct.toFixed(0)}%</Text>
                    {carbsPct > 45 && (
                      <Text style={styles.macroFlag}>{carbsPct > 55 ? 'excessif' : 'eleve'}</Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Allergen chips */}
          {hasAllergens && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="alert-circle" size={20} color={COLORS.warning} style={{ marginRight: SPACING.sm }} />
                <Text style={styles.cardTitle}>Allergenes detectes</Text>
                <View style={[styles.countBadge, { backgroundColor: COLORS.warningSoft }]}>
                  <Text style={[styles.countText, { color: COLORS.warning }]}>{allergensList.length}</Text>
                </View>
              </View>
              <Text style={styles.allergenIntro}>
                Ingredients a surveiller si votre animal est sensible :
              </Text>
              <View style={styles.chipRow}>
                {allergensList.map((allergen, idx) => (
                  <View key={idx} style={styles.allergenChip}>
                    <Feather name="alert-triangle" size={11} color={COLORS.warning} />
                    <Text style={styles.allergenChipText}>{allergen}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Positive markers */}
          {hasPositiveMarkers && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="check-circle" size={20} color={COLORS.scoreExcellent} style={{ marginRight: SPACING.sm }} />
                <Text style={styles.cardTitle}>Points positifs</Text>
              </View>
              {positiveMarkers.map((marker, idx) => (
                <View key={idx} style={[styles.positiveRow, idx === positiveMarkers.length - 1 && styles.lastRow]}>
                  <View style={styles.positiveDot}>
                    <Feather name="check" size={14} color={COLORS.scoreExcellent} />
                  </View>
                  <Text style={styles.positiveText}>{marker}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Marketing tricks warnings */}
          {hasMarketingTricks && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="eye" size={20} color={COLORS.scoreMediocre} style={{ marginRight: SPACING.sm }} />
                <Text style={styles.cardTitle}>Attention marketing</Text>
              </View>
              <Text style={styles.trickIntro}>
                Arguments commerciaux a ne pas prendre pour argent comptant :
              </Text>
              {marketingTricks.map((trick, idx) => (
                <View key={idx} style={[styles.trickRow, idx === marketingTricks.length - 1 && styles.lastRow]}>
                  <Feather name="eye-off" size={14} color={COLORS.scoreMediocre} style={{ marginTop: 2 }} />
                  <Text style={styles.trickText}>{trick}</Text>
                </View>
              ))}
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
                      {ingredient.name || 'Ingrédient inconnu'}
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
                { label: 'Protéines', value: product.scoreDetails.protein, icon: 'trending-up' },
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
                product.category && { label: 'Catégorie', value: product.category.charAt(0).toUpperCase() + product.category.slice(1), icon: 'grid' },
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

          {/* Better alternatives (for low-score products) */}
          {alternatives.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="thumbs-up" size={20} color={COLORS.scoreExcellent} style={{ marginRight: SPACING.sm }} />
                <Text style={styles.cardTitle}>Meilleures alternatives</Text>
              </View>
              <Text style={styles.altIntro}>
                Produits mieux notes dans la meme categorie :
              </Text>
              {alternatives.map((alt, idx) => {
                const altColor = getScoreColor(alt.nutritionScore || 0);
                return (
                  <TouchableOpacity
                    key={alt._id || idx}
                    style={[styles.altRow, idx === alternatives.length - 1 && styles.lastRow]}
                    onPress={() => navigation.push('ProductResult', { product: alt })}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.altScoreBadge, { backgroundColor: altColor + '15' }]}>
                      <Text style={[styles.altScoreText, { color: altColor }]}>
                        {alt.nutritionScore || 0}
                      </Text>
                    </View>
                    <View style={styles.altInfo}>
                      <Text style={styles.altName} numberOfLines={1}>{alt.name}</Text>
                      <Text style={styles.altBrand} numberOfLines={1}>{alt.brand || ''}</Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={COLORS.pebble} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Scan milestone celebration */}
          {gamification && [10, 50, 100, 250, 500].includes(gamification.totalScans) && (
            <View style={styles.milestoneCard}>
              <LinearGradient
                colors={['#527A56', '#6B8F71']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.milestoneGradient}
              >
                <Text style={styles.milestoneEmoji}>
                  {gamification.totalScans >= 100 ? '🏆' : gamification.totalScans >= 50 ? '🌟' : '🎯'}
                </Text>
                <Text style={styles.milestoneTitle}>
                  {gamification.totalScans}e scan !
                </Text>
                <Text style={styles.milestoneText}>
                  {gamification.totalScans >= 100
                    ? 'Vous êtes un vrai expert ! Rien ne vous échappe.'
                    : gamification.totalScans >= 50
                      ? 'Impressionnant ! Vous protégez votre animal comme un pro.'
                      : 'Bravo ! Continuez a proteger votre compagnon.'}
                </Text>
              </LinearGradient>
            </View>
          )}

          {/* "Produit dangereux évité" impact card - displays when current product is bad */}
          {hasScore && score < 40 && gamification?.badProductsAvoided > 0 && (
            <View style={styles.avoidedCard}>
              <LinearGradient
                colors={['#6B8F71', '#8CB092']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avoidedGradient}
              >
                <View style={styles.avoidedIconCircle}>
                  <Feather name="shield" size={22} color="#FFF" />
                </View>
                <View style={styles.avoidedContent}>
                  <Text style={styles.avoidedTitle}>
                    {gamification.badProductsAvoided === 1
                      ? 'Premier produit dangereux évité !'
                      : `${gamification.badProductsAvoided} produits dangereux évités`}
                  </Text>
                  <Text style={styles.avoidedText}>
                    Grace a Pepete, tu sais ce qu'il faut eviter pour ton animal 🐾
                  </Text>
                </View>
              </LinearGradient>
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

      {/* Confetti celebration on great scores */}
      <Confetti active={showConfetti} count={40} />

      {/* Badge unlock modal */}
      <BadgeUnlockModal
        visible={!!badgeModal}
        badgeKey={badgeModal}
        onClose={() => {
          setBadgeModal(null);
          // Show next badge in queue
          if (badgeQueue.length > 0) {
            setTimeout(() => setBadgeModal(badgeQueue.shift()), 400);
          }
        }}
      />

      {/* First scan share nudge */}
      <ShareNudgeModal
        visible={showShareNudge}
        product={product}
        onClose={() => setShowShareNudge(false)}
      />

      {/* Extreme score viral share prompt */}
      <ExtremeScoreSharePrompt
        product={product}
        score={score}
        visible={showExtremeShare && !showShareNudge}
        onDismiss={() => setShowExtremeShare(false)}
      />

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

  // Ingrédients
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

  // Détails
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

  // Milestone
  milestoneCard: {
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    marginBottom: SPACING.base,
    ...SHADOWS.md,
  },
  milestoneGradient: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  milestoneEmoji: { fontSize: 40, marginBottom: SPACING.sm },
  milestoneTitle: {
    fontSize: FONT_SIZE['2xl'] || 24,
    fontFamily: FONTS.heading,
    color: '#FFF',
    marginBottom: SPACING.xs,
  },
  milestoneText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodyMedium,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Avoided product impact card
  avoidedCard: {
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    marginBottom: SPACING.base,
    ...SHADOWS.md,
  },
  avoidedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  avoidedIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avoidedContent: { flex: 1 },
  avoidedTitle: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.heading,
    color: '#FFF',
  },
  avoidedText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    lineHeight: 16,
  },

  // Alternatives
  altIntro: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.stone,
    marginBottom: SPACING.md,
  },
  altRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  altScoreBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  altScoreText: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.heading,
  },
  altInfo: {
    flex: 1,
  },
  altName: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.charcoal,
    marginBottom: 2,
  },
  altBrand: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.pebble,
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

  // Nutritionist pro-grade analysis cards
  criticalCard: {
    borderWidth: 1.5,
    borderColor: COLORS.scoreVeryBad + '40',
    backgroundColor: COLORS.scoreVeryBadBg,
  },
  criticalIntro: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.body,
    color: COLORS.charcoal,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  criticalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  criticalBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  criticalText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.charcoal,
    lineHeight: 20,
  },
  kcalHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    backgroundColor: COLORS.linen,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  kcalValue: {
    fontSize: 34,
    fontFamily: FONTS.heading,
    color: COLORS.primary,
    lineHeight: 38,
  },
  kcalUnit: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.charcoal,
  },
  kcalSubtext: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.body,
    color: COLORS.stone,
    marginTop: 2,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  macroItem: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: COLORS.linen,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.stone,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  macroValue: {
    fontSize: FONT_SIZE.lg,
    fontFamily: FONTS.heading,
    color: COLORS.charcoal,
    marginTop: 4,
  },
  macroFlag: {
    fontSize: 10,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.scoreVeryBad,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  allergenIntro: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.body,
    color: COLORS.stone,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  allergenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.warningSoft,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  allergenChipText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.warning,
    textTransform: 'capitalize',
  },
  positiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.linen,
  },
  positiveDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.scoreExcellentBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positiveText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.charcoal,
    textTransform: 'capitalize',
  },
  trickIntro: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.body,
    color: COLORS.stone,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  trickRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.linen,
  },
  trickText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.body,
    color: COLORS.charcoal,
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
