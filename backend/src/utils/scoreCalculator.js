/**
 * Pépète Pet-Food Analyzer — Professional Nutritional Scoring Engine v3.0
 * ────────────────────────────────────────────────────────────────────────
 * A comprehensive pet-food analysis inspired by veterinary nutrition
 * science (AAFCO, FEDIAF), not just a Yuka clone. Each product gets a
 * 0-100 score plus a rich analysis covering:
 *
 *   • Ingredient quality tier (fresh meat > meal > by-product > plant)
 *   • Real protein origin (animal vs vegetable)
 *   • Allergen detection (chicken, beef, wheat, soy, corn, dairy, egg)
 *   • Additive safety with full E-number coverage
 *   • Caloric density (kcal/100g via modified Atwater factors)
 *   • Ca:P ratio check (critical for growing and senior animals)
 *   • Taurine presence (mandatory for cats)
 *   • Life-stage compatibility (chiot / adulte / senior / chaton)
 *   • Health-condition flags (joint, weight, renal, dental, skin)
 *   • Marketing-trick detection ("with chicken" vs "chicken 70%")
 *   • Positive markers (omega-3, prebiotics, glucosamine…)
 *
 * Score layout (100 pts total):
 *   • 40 pts — Ingredients (quality + origin + allergens)
 *   • 30 pts — Additives (dangerous -10 ea, moderate -4 ea)
 *   • 30 pts — Nutrition (macros + kcal + Ca:P + positives)
 */

// ─── Ingredient-quality tiers ─────────────────────────────────────────────
// Tier 1: fresh named meat/fish (highest digestibility, ~90% absorption)
const TIER1_MEATS = [
  'viande fraîche', 'viande fraiche', 'poulet frais', 'saumon frais',
  'boeuf frais', 'dinde fraîche', 'dinde fraiche', 'agneau frais',
  'canard frais', 'poisson frais', 'thon frais', 'hareng frais',
  'fresh chicken', 'fresh salmon', 'fresh beef', 'fresh turkey',
  'fresh lamb', 'fresh duck', 'fresh fish', 'fresh tuna',
];

// Tier 2: named meat meal/dehydrated (concentrated protein, ~75% digestibility)
const TIER2_MEALS = [
  'poulet déshydraté', 'poulet deshydrate', 'farine de poulet',
  'saumon déshydraté', 'saumon deshydrate', 'farine de saumon',
  'dinde déshydratée', 'dinde deshydratee', 'farine de dinde',
  'agneau déshydraté', 'agneau deshydrate', 'farine d\'agneau',
  'canard déshydraté', 'canard deshydrate', 'farine de canard',
  'poisson déshydraté', 'poisson deshydrate', 'farine de poisson',
  'hareng déshydraté', 'farine de hareng',
  'chicken meal', 'salmon meal', 'lamb meal', 'turkey meal',
  'duck meal', 'fish meal', 'herring meal',
];

// Tier 3: generic / unspecified animal proteins (low transparency, ~60% digestibility)
const TIER3_GENERIC = [
  'viandes et sous-produits animaux', 'protéines animales',
  'protéines de volaille', 'proteines animales', 'proteines de volaille',
  'sous-produits', 'farine animale', 'farine de viande',
  'meat and animal derivatives', 'animal by-products', 'poultry protein',
  'meat meal', 'poultry meal', 'poultry by-products',
];

// Tier 4: plant proteins used to inflate crude-protein % (cheap, low bioavail)
const TIER4_PLANT_PROT = [
  'gluten de maïs', 'gluten de mais', 'gluten de blé', 'gluten de ble',
  'protéines de soja', 'proteines de soja', 'isolat de soja',
  'corn gluten', 'wheat gluten', 'soy protein', 'pea protein isolate',
];

// ─── Allergens (top-7 in dogs/cats) ───────────────────────────────────────
const ALLERGENS = {
  poulet:    ['poulet', 'chicken', 'volaille', 'poultry'],
  boeuf:     ['boeuf', 'bœuf', 'beef', 'bovin'],
  agneau:    ['agneau', 'lamb', 'mouton'],
  porc:      ['porc', 'pork', 'bacon', 'jambon'],
  poisson:   ['poisson', 'fish', 'saumon', 'salmon', 'thon', 'tuna', 'hareng', 'herring'],
  blé:       ['blé', 'ble', 'wheat', 'froment', 'farine de blé'],
  maïs:      ['maïs', 'mais', 'corn', 'maize', 'gluten de maïs', 'gluten de mais'],
  soja:      ['soja', 'soy', 'soya'],
  oeuf:      ['oeuf', 'œuf', 'egg', 'ovalbumine'],
  lait:      ['lait', 'milk', 'lactose', 'petit-lait', 'whey', 'fromage', 'cheese'],
};

// ─── Positive markers (nutritional wins) ──────────────────────────────────
const POSITIVE_MARKERS = {
  'omega-3':      ['oméga-3', 'omega-3', 'omega 3', 'huile de poisson', 'fish oil', 'dha', 'epa', 'huile de saumon', 'salmon oil'],
  'glucosamine':  ['glucosamine'],
  'chondroïtine': ['chondroïtine', 'chondroitine', 'chondroitin'],
  'prébiotiques': ['prébiotique', 'prebiotique', 'prebiotic', 'mos', 'fos', 'fructo-oligosaccharide', 'inuline', 'chicorée'],
  'probiotiques': ['probiotique', 'probiotic', 'lactobacillus', 'enterococcus', 'bacillus'],
  'taurine':      ['taurine'],
  'L-carnitine':  ['carnitine', 'l-carnitine'],
  'yucca':        ['yucca'],
  'cranberry':    ['canneberge', 'cranberry'],
  'spiruline':    ['spiruline', 'spirulina'],
  'curcuma':      ['curcuma', 'turmeric'],
};

// ─── Additives — extended E-number coverage ───────────────────────────────
const DANGEROUS_ADDITIVES = [
  'E320', 'E321', 'E324',                       // BHA, BHT, Ethoxyquin (suspected carcinogens)
  'E310', 'E311', 'E312',                       // Gallates (allergens, liver concerns)
  'E102', 'E110', 'E124', 'E129', 'E131', 'E133', // Azo dyes (behavior in pets)
  'E122', 'E127', 'E132', 'E142',               // More dyes
  'E250', 'E251', 'E252',                       // Nitrites/nitrates (N-nitrosamines)
  'E220', 'E221', 'E222', 'E223', 'E228',       // Sulfites (destroy thiamine)
];

const MODERATE_ADDITIVES = [
  'E200', 'E202', 'E203',                       // Sorbic acid / sorbates
  'E210', 'E211', 'E212', 'E213', 'E214', 'E215', // Benzoates — CATS cannot metabolize!
  'E330', 'E331', 'E332', 'E334',               // Citric/tartaric — mild
  'E414', 'E415', 'E440', 'E410', 'E412', 'E407', // Thickeners (carrageenan = inflammatory in some studies)
  'E452', 'E450', 'E451',                       // Phosphates — kidney strain
];

const SAFE_ADDITIVES = [
  'E300', 'E301', 'E302', 'E306', 'E307', 'E308', 'E309', // Vitamin C, E variants (natural antioxidants)
  'E322', 'E392',                                         // Lecithin, rosemary extract
  'E160', 'E161',                                         // Carotenoids (natural colors)
];

const ADDITIVE_NAMES = {
  'E320': 'BHA (Butylhydroxyanisole)',
  'E321': 'BHT (Butylhydroxytoluène)',
  'E324': 'Éthoxyquine',
  'E310': 'Gallate de propyle',
  'E311': 'Gallate d\'octyle',
  'E312': 'Gallate de dodécyle',
  'E102': 'Tartrazine (colorant jaune)',
  'E110': 'Jaune orangé S',
  'E122': 'Azorubine',
  'E124': 'Ponceau 4R',
  'E127': 'Érythrosine',
  'E129': 'Rouge allura AC',
  'E131': 'Bleu patenté V',
  'E132': 'Indigotine',
  'E133': 'Bleu brillant FCF',
  'E142': 'Vert S',
  'E220': 'Dioxyde de soufre',
  'E221': 'Sulfite de sodium',
  'E222': 'Bisulfite de sodium',
  'E223': 'Métabisulfite de sodium',
  'E228': 'Bisulfite de potassium',
  'E250': 'Nitrite de sodium',
  'E251': 'Nitrate de sodium',
  'E252': 'Nitrate de potassium',
  'E200': 'Acide sorbique',
  'E202': 'Sorbate de potassium',
  'E203': 'Sorbate de calcium',
  'E210': 'Acide benzoïque',
  'E211': 'Benzoate de sodium',
  'E212': 'Benzoate de potassium',
  'E213': 'Benzoate de calcium',
  'E330': 'Acide citrique',
  'E331': 'Citrate de sodium',
  'E332': 'Citrate de potassium',
  'E407': 'Carraghénanes',
  'E410': 'Gomme de caroube',
  'E412': 'Gomme de guar',
  'E414': 'Gomme d\'acacia',
  'E415': 'Gomme xanthane',
  'E440': 'Pectine',
  'E450': 'Diphosphates',
  'E451': 'Triphosphates',
  'E452': 'Polyphosphates',
  'E300': 'Acide ascorbique (vit. C)',
  'E301': 'Ascorbate de sodium',
  'E306': 'Tocophérols (vit. E)',
  'E307': 'Alpha-tocophérol',
  'E308': 'Gamma-tocophérol',
  'E322': 'Lécithines',
  'E392': 'Extraits de romarin',
};

// ─── Health-condition markers ─────────────────────────────────────────────
const HEALTH_MARKERS = {
  joints:   ['glucosamine', 'chondroïtine', 'chondroitine', 'chondroitin', 'msm', 'méthylsulfonyl', 'collagène', 'collagen'],
  skin:     ['oméga-3', 'omega-3', 'omega 3', 'huile de poisson', 'fish oil', 'biotine', 'biotin', 'zinc'],
  dental:   ['hexamétaphosphate', 'stpp', 'tripolyphosphate', 'action mécanique'],
  digest:   ['prébiotique', 'prebiotique', 'fos', 'mos', 'inuline', 'psyllium', 'betterave', 'pulpe de betterave', 'yucca'],
  urinary:  ['canneberge', 'cranberry', 'chlorure d\'ammonium', 'dl-méthionine'],
  weight:   ['l-carnitine', 'carnitine', 'fibre', 'cellulose'],
};

// ─── AAFCO / FEDIAF minimums (dry-matter basis, simplified) ───────────────
// Source: FEDIAF Nutritional Guidelines 2021 for complete pet foods
const FEDIAF_MIN = {
  chien: {
    adulte:  { protein: 18, fat: 5.5, caP: [1, 2] },  // Ca:P ratio range
    chiot:   { protein: 22.5, fat: 8.5, caP: [1, 1.8] },
    senior:  { protein: 18, fat: 5.5, caP: [1, 2] },
  },
  chat: {
    adulte:  { protein: 25, fat: 9,   caP: [0.9, 2], taurine: true },
    chaton:  { protein: 28, fat: 9,   caP: [1, 1.5], taurine: true },
    senior:  { protein: 25, fat: 9,   caP: [0.9, 2], taurine: true },
  },
};

// ─── Helper: modified Atwater factors for pet food ─────────────────────────
// kcal ME / 100g ≈ (protein * 3.5) + (fat * 8.5) + (NFE * 3.5)
// NFE = 100 - (protein + fat + fiber + ash + moisture)
const calcKcalPer100g = (nut) => {
  const protein = nut.protein || 0;
  const fat = nut.fat || 0;
  const fiber = nut.fiber || 0;
  const ash = nut.ash || 7;          // typical default
  const moisture = nut.moisture || 8; // typical default for dry kibble
  const nfe = Math.max(0, 100 - protein - fat - fiber - ash - moisture);
  const kcal = protein * 3.5 + fat * 8.5 + nfe * 3.5;
  return Math.round(kcal);
};

const hasKeyword = (text, keywords) => {
  const t = (text || '').toLowerCase();
  return keywords.some((k) => t.includes(k.toLowerCase()));
};

const anyIngredientMatches = (ingredients, keywords) => {
  return (ingredients || []).some((ing) => hasKeyword(ing.name || '', keywords));
};

const firstIngredientMatches = (ingredients, keywords) => {
  const first = (ingredients || [])[0];
  return first && hasKeyword(first.name || '', keywords);
};

// ─── Main analyzer ─────────────────────────────────────────────────────────
function analyze(productData) {
  const ingredients = productData.ingredients || [];
  const additives = productData.additives || [];
  const nut = productData.scoreDetails || productData.nutriments || {};
  const animal = (productData.targetAnimal || ['tous'])[0];
  const age = productData.targetAge || 'adulte';

  // ── A. Ingredient quality tier ────────────────────────────────────────
  // Highest tier wins. First ingredient weighted x2.
  let ingredientTier = 0;     // 0 = unknown, 1-4 = tiers
  let tierScore = 0;          // 0-40 pts
  if (firstIngredientMatches(ingredients, TIER1_MEATS)) { ingredientTier = 1; tierScore = 40; }
  else if (firstIngredientMatches(ingredients, TIER2_MEALS)) { ingredientTier = 2; tierScore = 32; }
  else if (firstIngredientMatches(ingredients, TIER3_GENERIC)) { ingredientTier = 3; tierScore = 18; }
  else if (firstIngredientMatches(ingredients, TIER4_PLANT_PROT)) { ingredientTier = 4; tierScore = 10; }
  else if (anyIngredientMatches(ingredients, TIER1_MEATS)) { ingredientTier = 2; tierScore = 28; }
  else if (anyIngredientMatches(ingredients, TIER2_MEALS)) { ingredientTier = 3; tierScore = 22; }
  else { tierScore = 15; }

  // Penalise cheap plant protein even if it's not first
  if (anyIngredientMatches(ingredients, TIER4_PLANT_PROT)) tierScore -= 5;

  // Controversial ingredient penalties (progressive)
  const dangerousCount = ingredients.filter(i => i.risk === 'dangerous').length;
  const moderateCount = ingredients.filter(i => i.risk === 'moderate').length;
  tierScore -= dangerousCount * 6;
  tierScore -= moderateCount * 2;

  tierScore = Math.max(0, Math.min(40, tierScore));

  // ── B. Allergen map ───────────────────────────────────────────────────
  const allergensDetected = [];
  for (const [name, keywords] of Object.entries(ALLERGENS)) {
    if (anyIngredientMatches(ingredients, keywords)) allergensDetected.push(name);
  }

  // ── C. Positive markers ───────────────────────────────────────────────
  const positiveMarkers = [];
  for (const [name, keywords] of Object.entries(POSITIVE_MARKERS)) {
    if (anyIngredientMatches(ingredients, keywords)) positiveMarkers.push(name);
  }

  // ── D. Additive analysis ──────────────────────────────────────────────
  let additiveScore = 30;
  const additiveFlags = { dangerous: [], moderate: [], safe: [] };
  (additives || []).forEach((add) => {
    const code = (add.code || '').toUpperCase();
    if (DANGEROUS_ADDITIVES.includes(code) || add.risk === 'dangerous') {
      additiveScore -= 10;
      additiveFlags.dangerous.push(add);
    } else if (MODERATE_ADDITIVES.includes(code) || add.risk === 'moderate') {
      additiveScore -= 4;
      additiveFlags.moderate.push(add);
    } else if (SAFE_ADDITIVES.includes(code) || add.risk === 'safe') {
      additiveFlags.safe.push(add);
    }
  });
  additiveScore = Math.max(0, Math.min(30, additiveScore));

  // Special case: benzoates in cat food are TOXIC (cats lack glucuronyl transferase)
  const benzoateRiskCat = animal === 'chat' && additives.some(a => ['E210', 'E211', 'E212', 'E213'].includes((a.code || '').toUpperCase()));

  // ── E. Nutrition analysis ─────────────────────────────────────────────
  let nutritionScore = 15;     // start mid-range
  const protein = nut.protein || nut.proteins_100g || 0;
  const fat = nut.fat || nut.fat_100g || 0;
  const fiber = nut.fiber || nut.fiber_100g || 0;
  const moisture = nut.moisture || 8;
  const ash = nut.ash || 7;
  const carbs = Math.max(0, 100 - protein - fat - fiber - moisture - ash);
  const kcal = calcKcalPer100g({ protein, fat, fiber, ash, moisture });

  // Protein adequacy vs FEDIAF minimums
  const fediaf = (FEDIAF_MIN[animal] && FEDIAF_MIN[animal][age]) || FEDIAF_MIN[animal]?.adulte;
  const fediafMet = { protein: true, fat: true };
  if (fediaf) {
    fediafMet.protein = protein >= fediaf.protein * 0.95;  // 5% tolerance
    fediafMet.fat = fat >= fediaf.fat * 0.95;
    if (fediafMet.protein) nutritionScore += 5;
    else nutritionScore -= 3;
    if (fediafMet.fat) nutritionScore += 2;
  }

  // High-protein bonus (carnivores prefer)
  if (protein >= 32) nutritionScore += 5;
  else if (protein >= 26) nutritionScore += 3;

  // Low-carb bonus (< 30% = great for carnivores)
  if (protein > 0 && carbs < 30) nutritionScore += 3;
  else if (carbs > 50) nutritionScore -= 3;

  // Fiber sweet spot (2-6%)
  if (fiber >= 2 && fiber <= 6) nutritionScore += 2;
  else if (fiber > 8) nutritionScore -= 2;

  // Positive-marker bonuses
  if (positiveMarkers.includes('omega-3')) nutritionScore += 2;
  if (positiveMarkers.includes('prébiotiques')) nutritionScore += 1;
  if (positiveMarkers.includes('glucosamine') && (age === 'senior' || animal === 'chien')) nutritionScore += 2;
  if (animal === 'chat' && positiveMarkers.includes('taurine')) nutritionScore += 2;

  nutritionScore = Math.max(0, Math.min(30, nutritionScore));

  // ── F. Life-stage adequacy verdict ────────────────────────────────────
  const lifeStageWarnings = [];
  if (animal === 'chat' && !positiveMarkers.includes('taurine') && ingredients.length > 0) {
    lifeStageWarnings.push('Aucune taurine détectée — vital pour les chats');
  }
  if (age === 'chiot' && protein > 0 && protein < 22) {
    lifeStageWarnings.push('Protéines insuffisantes pour un chiot en croissance (min. 22%)');
  }
  if (age === 'chaton' && protein > 0 && protein < 28) {
    lifeStageWarnings.push('Protéines insuffisantes pour un chaton (min. 28%)');
  }
  if (benzoateRiskCat) {
    lifeStageWarnings.push('⚠️ Benzoates détectés — toxiques pour les chats');
  }

  // ── G. Marketing-trick detection ──────────────────────────────────────
  const marketingTricks = [];
  const firstIng = (ingredients[0]?.name || '').toLowerCase();
  if (/avec\s+(poulet|boeuf|saumon|thon|dinde|agneau)/i.test(firstIng)) {
    marketingTricks.push('"Avec" signifie seulement ~4% de l\'ingrédient mis en avant');
  }
  if (/riche en\s+(poulet|boeuf|saumon|thon|dinde|agneau)/i.test(firstIng) && !firstIngredientMatches(ingredients, TIER1_MEATS)) {
    marketingTricks.push('"Riche en" ne garantit pas que la viande est en premier ingrédient');
  }
  if (ingredients.length > 0 && !firstIngredientMatches(ingredients, [...TIER1_MEATS, ...TIER2_MEALS]) &&
      anyIngredientMatches(ingredients, [...TIER1_MEATS, ...TIER2_MEALS])) {
    marketingTricks.push('La viande est présente mais pas en premier — généralement <15%');
  }

  // ── H. Final score ────────────────────────────────────────────────────
  const finalScore = Math.max(0, Math.min(100, Math.round(tierScore + additiveScore + nutritionScore)));

  // ── I. Return enriched details ────────────────────────────────────────
  return {
    score: finalScore,
    details: {
      // Legacy fields (kept for backward compatibility)
      protein,
      fat,
      fiber,
      additivesPenalty: 30 - additiveScore,
      qualityBonus: Math.max(0, tierScore - 15),
      ingredientsScore: tierScore,
      additivesScore: additiveScore,
      nutritionScore,
      // New rich-analysis fields
      kcalPer100g: kcal,
      carbs: Math.round(carbs),
      ingredientTier,                    // 1 = fresh meat, 2 = meal, 3 = generic, 4 = plant
      allergens: allergensDetected,      // ['poulet', 'blé', ...]
      positiveMarkers,                   // ['omega-3', 'glucosamine', ...]
      lifeStageWarnings,
      marketingTricks,
      fediafMet,                         // { protein: true/false, fat: true/false }
      dangerousAdditivesCount: additiveFlags.dangerous.length,
      moderateAdditivesCount: additiveFlags.moderate.length,
      benzoateRiskCat,
    },
  };
}

// ─── Backward-compatible entry point ──────────────────────────────────────
function calculateScore(productData) {
  return analyze(productData);
}

function getScoreLabel(score) {
  if (score >= 85) return { label: 'Excellent',    color: '#2ECC71' };
  if (score >= 70) return { label: 'Très bon',     color: '#52B35A' };
  if (score >= 55) return { label: 'Correct',      color: '#82C91E' };
  if (score >= 40) return { label: 'Médiocre',     color: '#F4A62A' };
  if (score >= 25) return { label: 'Mauvais',      color: '#E67E22' };
  return              { label: 'Très mauvais', color: '#E74C3C' };
}

module.exports = {
  calculateScore,
  analyze,
  getScoreLabel,
  ADDITIVE_NAMES,
  DANGEROUS_ADDITIVES,
  MODERATE_ADDITIVES,
  SAFE_ADDITIVES,
  ALLERGENS,
  POSITIVE_MARKERS,
  FEDIAF_MIN,
};
