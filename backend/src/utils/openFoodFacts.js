/**
 * Integration Open Food Facts / Open Pet Food Facts
 * Recherche automatique de produits par code-barres
 * quand ils ne sont pas dans notre base locale
 */
const axios = require('axios');
const { calculateScore } = require('./scoreCalculator');

const OFF_API = 'https://world.openfoodfacts.org/api/v2/product';
const OPFF_API = 'https://world.openpetfoodfacts.org/api/v2/product';

// Lists for risk classification (mirrors scoreCalculator)
const DANGEROUS_INGREDIENTS = [
  'sous-produits animaux', 'farine animale', 'bha', 'bht', 'ethoxyquin',
  'propylene glycol', 'by-products', 'animal meal', 'propylene'
];

const CONTROVERSIAL_INGREDIENTS = [
  'sous-produits animaux', 'farine animale', 'bha', 'bht', 'ethoxyquin',
  'propylene glycol', 'colorant', 'sucre', 'sel ajouté', 'sel ajoute', 'maïs', 'mais',
  'blé', 'ble', 'soja', 'gluten', 'carraghénane', 'carraghenane',
  'by-products', 'animal meal', 'corn', 'wheat', 'soy', 'sugar', 'salt',
  'propylene', 'colorant', 'carrageenan'
];

const MODERATE_INGREDIENTS = [
  'colorant', 'sucre', 'sel ajouté', 'sel ajoute', 'maïs', 'mais',
  'blé', 'ble', 'soja', 'gluten', 'carraghénane', 'carraghenane',
  'corn', 'wheat', 'soy', 'sugar', 'salt', 'carrageenan', 'amidon'
];

const DANGEROUS_ADDITIVES = [
  'E320', 'E321', 'E324', 'E310', 'E311', 'E312',
  'E102', 'E110', 'E124', 'E129', 'E131', 'E133',
  'E250', 'E251', 'E252'
];

const MODERATE_ADDITIVES = [
  'E200', 'E202', 'E211', 'E212',
  'E330', 'E331', 'E332',
  'E414', 'E415', 'E440'
];

// Noms lisibles des additifs courants
const ADDITIVE_NAMES = {
  'E320': 'BHA (Butylhydroxyanisole)',
  'E321': 'BHT (Butylhydroxytoluène)',
  'E324': 'Ethoxyquine',
  'E310': 'Gallate de propyle',
  'E311': 'Gallate d\'octyle',
  'E312': 'Gallate de dodécyle',
  'E102': 'Tartrazine (colorant jaune)',
  'E110': 'Jaune orangé S (colorant)',
  'E124': 'Ponceau 4R (colorant rouge)',
  'E129': 'Rouge allura AC (colorant)',
  'E131': 'Bleu patenté V (colorant)',
  'E133': 'Bleu brillant FCF (colorant)',
  'E250': 'Nitrite de sodium',
  'E251': 'Nitrate de sodium',
  'E252': 'Nitrate de potassium',
  'E200': 'Acide sorbique (conservateur)',
  'E202': 'Sorbate de potassium (conservateur)',
  'E211': 'Benzoate de sodium (conservateur)',
  'E212': 'Benzoate de potassium (conservateur)',
  'E330': 'Acide citrique',
  'E331': 'Citrate de sodium',
  'E332': 'Citrate de potassium',
  'E414': 'Gomme d\'acacia',
  'E415': 'Gomme xanthane',
  'E440': 'Pectine',
  'E306': 'Tocophérols (vitamine E)',
  'E307': 'Alpha-tocophérol',
  'E300': 'Acide ascorbique (vitamine C)',
  'E392': 'Extraits de romarin',
  'E270': 'Acide lactique',
  'E322': 'Lécithines',
  'E412': 'Gomme de guar',
  'E407': 'Carraghénanes',
  'E508': 'Chlorure de potassium',
  'E452': 'Polyphosphates',
};

/**
 * Recherche un produit sur Open Pet Food Facts puis Open Food Facts
 * @param {string} barcode
 * @returns {object|null} Donnees produit formatees pour notre schema
 */
async function fetchProductFromOpenFoodFacts(barcode) {
  // 1. Essayer d'abord Open Pet Food Facts (specifique animaux)
  try {
    const petResponse = await axios.get(`${OPFF_API}/${barcode}.json`, { timeout: 10000 });
    if (petResponse.data?.status === 1 && petResponse.data?.product) {
      return formatProduct(petResponse.data.product, barcode, 'openpetfoodfacts');
    }
  } catch (err) {
    console.log('Open Pet Food Facts API error:', err.message);
  }

  // 2. Fallback sur Open Food Facts (produits generaux)
  try {
    const response = await axios.get(`${OFF_API}/${barcode}.json`, { timeout: 10000 });
    if (response.data?.status === 1 && response.data?.product) {
      return formatProduct(response.data.product, barcode, 'openfoodfacts');
    }
  } catch (err) {
    console.log('Open Food Facts API error:', err.message);
  }

  return null;
}

/**
 * Formate les donnees Open Food Facts vers notre schema Product
 */
function formatProduct(offProduct, barcode, source) {
  // Extraire les ingredients avec classification des risques
  const ingredients = [];
  const classifyIngredient = (name) => {
    const nameLower = (name || '').toLowerCase();
    if (!nameLower) return { isControversial: false, risk: 'safe' };
    const isDangerous = DANGEROUS_INGREDIENTS.some(c => nameLower.includes(c));
    if (isDangerous) return { isControversial: true, risk: 'dangerous' };
    const isModerate = MODERATE_INGREDIENTS.some(c => nameLower.includes(c));
    if (isModerate) return { isControversial: true, risk: 'moderate' };
    return { isControversial: false, risk: 'safe' };
  };

  if (offProduct.ingredients) {
    offProduct.ingredients.slice(0, 15).forEach((ing) => {
      const name = (ing.text || ing.id || 'Inconnu');
      const { isControversial, risk } = classifyIngredient(name);
      ingredients.push({ name, isControversial, risk });
    });
  }
  // Also check ingredients_text if structured ingredients are missing
  if (ingredients.length === 0 && offProduct.ingredients_text) {
    offProduct.ingredients_text.split(/[,;]/).slice(0, 15).forEach((text) => {
      const name = text.trim();
      if (!name) return;
      const { isControversial, risk } = classifyIngredient(name);
      ingredients.push({ name, isControversial, risk });
    });
  }

  // Extraire les additifs avec classification precise
  const additives = [];
  if (offProduct.additives_tags) {
    offProduct.additives_tags.forEach((additive) => {
      const code = additive.replace('en:', '').toUpperCase();
      let risk = 'safe';
      if (DANGEROUS_ADDITIVES.includes(code)) risk = 'dangerous';
      else if (MODERATE_ADDITIVES.includes(code)) risk = 'moderate';
      additives.push({
        code,
        name: ADDITIVE_NAMES[code] || code,
        risk,
      });
    });
  }

  // Determiner la categorie
  let category = 'alimentation';
  const categories = (offProduct.categories || '').toLowerCase();
  if (categories.includes('soin') || categories.includes('care')) category = 'soin';
  if (categories.includes('hygien') || categories.includes('shampoo')) category = 'hygiene';
  if (categories.includes('jouet') || categories.includes('toy')) category = 'jouet';

  // Determiner l'animal cible
  const targetAnimal = [];
  const productName = (offProduct.product_name || '').toLowerCase();
  const allText = `${productName} ${categories}`;
  if (allText.includes('chien') || allText.includes('dog')) targetAnimal.push('chien');
  if (allText.includes('chat') || allText.includes('cat')) targetAnimal.push('chat');
  if (allText.includes('rongeur') || allText.includes('hamster')) targetAnimal.push('rongeur');
  if (allText.includes('oiseau') || allText.includes('bird')) targetAnimal.push('oiseau');
  if (targetAnimal.length === 0) targetAnimal.push('tous');

  // Donnees nutritionnelles
  const nutriments = offProduct.nutriments || {};
  const scoreDetails = {
    protein: nutriments.proteins_100g || 0,
    fat: nutriments.fat_100g || 0,
    fiber: nutriments['fiber_100g'] || 0,
    additivesPenalty: 0,
    qualityBonus: 0,
  };

  const productData = {
    barcode,
    name: offProduct.product_name || offProduct.generic_name || 'Produit inconnu',
    brand: offProduct.brands || '',
    category,
    targetAnimal,
    ingredients,
    additives,
    scoreDetails,
    image: offProduct.image_url || offProduct.image_front_url || '',
    _source: source,
  };

  // Calculer le score Pépète
  const scoreResult = calculateScore(productData);
  productData.nutritionScore = scoreResult.score;
  productData.scoreDetails = scoreResult.details;

  return productData;
}

module.exports = { fetchProductFromOpenFoodFacts };
