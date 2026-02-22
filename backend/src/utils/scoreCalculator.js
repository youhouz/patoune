/**
 * Calcul du score Patoune pour les produits animaux (0-100)
 * Inspiré de Yuka, adapté pour les produits animaliers
 *
 * Le score prend en compte :
 * - Qualité des ingrédients (40%)
 * - Absence d'additifs dangereux (30%)
 * - Valeurs nutritionnelles (30%)
 */

const CONTROVERSIAL_INGREDIENTS = [
  'sous-produits animaux', 'farine animale', 'BHA', 'BHT', 'ethoxyquin',
  'propylene glycol', 'colorant', 'sucre', 'sel ajouté', 'maïs',
  'blé', 'soja', 'gluten', 'carraghénane'
];

const DANGEROUS_ADDITIVES = [
  'E320', 'E321', 'E324', 'E310', 'E311', 'E312', // Antioxydants
  'E102', 'E110', 'E124', 'E129', 'E131', 'E133', // Colorants
  'E250', 'E251', 'E252' // Nitrites/Nitrates
];

const MODERATE_ADDITIVES = [
  'E200', 'E202', 'E211', 'E212', // Conservateurs
  'E330', 'E331', 'E332', // Acidifiants
  'E414', 'E415', 'E440' // Épaississants
];

function calculateScore(productData) {
  let score = 70; // Score de base
  const details = {
    protein: 0,
    fat: 0,
    fiber: 0,
    additivesPenalty: 0,
    qualityBonus: 0
  };

  // === Analyse des ingrédients (40% du score) ===
  if (productData.ingredients && productData.ingredients.length > 0) {
    let ingredientScore = 40;
    let controversialCount = 0;

    productData.ingredients.forEach((ingredient) => {
      const name = ingredient.name.toLowerCase();

      // Vérifier si l'ingrédient est controversé
      const isControversial = CONTROVERSIAL_INGREDIENTS.some(c =>
        name.includes(c.toLowerCase())
      );

      if (isControversial || ingredient.isControversial) {
        controversialCount++;
        ingredientScore -= 5;
      }

      // Bonus pour les bons ingrédients
      if (name.includes('viande fraîche') || name.includes('poisson frais')) {
        details.qualityBonus += 5;
      }
      if (name.includes('légume') || name.includes('fruit')) {
        details.qualityBonus += 2;
      }
    });

    // Le premier ingrédient est le plus important
    if (productData.ingredients[0]) {
      const firstIngredient = productData.ingredients[0].name.toLowerCase();
      if (firstIngredient.includes('viande') || firstIngredient.includes('poisson') || firstIngredient.includes('poulet')) {
        details.qualityBonus += 10;
      }
    }

    score = score - (40 - Math.max(ingredientScore, 0));
  }

  // === Analyse des additifs (30% du score) ===
  if (productData.additives && productData.additives.length > 0) {
    productData.additives.forEach((additive) => {
      const code = (additive.code || '').toUpperCase();

      if (DANGEROUS_ADDITIVES.includes(code) || additive.risk === 'dangerous') {
        details.additivesPenalty += 10;
      } else if (MODERATE_ADDITIVES.includes(code) || additive.risk === 'moderate') {
        details.additivesPenalty += 4;
      }
    });

    score -= Math.min(details.additivesPenalty, 30);
  }

  // === Bonus qualité ===
  score += Math.min(details.qualityBonus, 15);

  // === Score nutritionnel (basé sur les détails si fournis) ===
  if (productData.scoreDetails) {
    const { protein, fat, fiber } = productData.scoreDetails;
    if (protein > 25) details.protein = 5;
    else if (protein > 15) details.protein = 3;

    if (fat < 15) details.fat = 3;
    else if (fat > 25) details.fat = -3;

    if (fiber > 3) details.fiber = 3;
    else if (fiber > 1) details.fiber = 1;

    score += details.protein + details.fat + details.fiber;
  }

  // Borner le score entre 0 et 100
  score = Math.max(0, Math.min(100, Math.round(score)));

  return { score, details };
}

/**
 * Retourne le label correspondant au score
 */
function getScoreLabel(score) {
  if (score >= 80) return { label: 'Excellent', color: '#2ECC71' };
  if (score >= 60) return { label: 'Bon', color: '#82C91E' };
  if (score >= 40) return { label: 'Médiocre', color: '#F4A62A' };
  if (score >= 20) return { label: 'Mauvais', color: '#E67E22' };
  return { label: 'Très mauvais', color: '#E74C3C' };
}

module.exports = { calculateScore, getScoreLabel };
