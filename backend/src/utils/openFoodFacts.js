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
const CONTROVERSIAL_INGREDIENTS = [
  'sous-produits animaux', 'farine animale', 'bha', 'bht', 'ethoxyquin',
  'propylene glycol', 'colorant', 'sucre', 'sel ajouté', 'sel ajoute', 'maïs', 'mais',
  'blé', 'ble', 'soja', 'gluten', 'carraghénane', 'carraghenane',
  'by-products', 'animal meal', 'corn', 'wheat', 'soy', 'sugar', 'salt',
  'propylene', 'colorant', 'carrageenan'
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

/**
 * Recherche un produit sur Open Pet Food Facts puis Open Food Facts
 * @param {string} barcode
 * @returns {object|null} Donnees produit formatees pour notre schema
 */
async function fetchProductFromOpenFoodFacts(barcode) {
  // 1. Essayer d'abord Open Pet Food Facts (specifique animaux)
  try {
    const petResponse = await axios.get(`${OPFF_API}/${barcode}.json`, { timeout: 5000 });
    if (petResponse.data?.status === 1 && petResponse.data?.product) {
      return formatProduct(petResponse.data.product, barcode, 'openpetfoodfacts');
    }
  } catch (err) {
    // Silencieux, on essaie l'autre API
  }

  // 2. Fallback sur Open Food Facts (produits generaux)
  try {
    const response = await axios.get(`${OFF_API}/${barcode}.json`, { timeout: 5000 });
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
  if (offProduct.ingredients) {
    offProduct.ingredients.slice(0, 15).forEach((ing) => {
      const name = (ing.text || ing.id || 'Inconnu');
      const nameLower = name.toLowerCase();
      const isControversial = CONTROVERSIAL_INGREDIENTS.some(c => nameLower.includes(c));
      ingredients.push({
        name,
        isControversial,
        risk: isControversial ? 'dangerous' : 'safe',
      });
    });
  }
  // Also check ingredients_text if structured ingredients are missing
  if (ingredients.length === 0 && offProduct.ingredients_text) {
    offProduct.ingredients_text.split(/[,;]/).slice(0, 15).forEach((text) => {
      const name = text.trim();
      if (!name) return;
      const nameLower = name.toLowerCase();
      const isControversial = CONTROVERSIAL_INGREDIENTS.some(c => nameLower.includes(c));
      ingredients.push({
        name,
        isControversial,
        risk: isControversial ? 'dangerous' : 'safe',
      });
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
        name: code,
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

  // Calculer le score Patoune
  const scoreResult = calculateScore(productData);
  productData.nutritionScore = scoreResult.score;
  productData.scoreDetails = scoreResult.details;

  return productData;
}

module.exports = { fetchProductFromOpenFoodFacts };
