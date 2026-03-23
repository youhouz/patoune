const { calculateScore, getScoreLabel } = require('./scoreCalculator');

let passed = 0;
let failed = 0;

function assert(label, actual, expected) {
  if (actual === expected) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label} — attendu ${JSON.stringify(expected)}, reçu ${JSON.stringify(actual)}`);
    failed++;
  }
}

function assertRange(label, actual, min, max) {
  if (actual >= min && actual <= max) {
    console.log(`  ✓ ${label} (${actual})`);
    passed++;
  } else {
    console.error(`  ✗ ${label} — attendu entre ${min} et ${max}, reçu ${actual}`);
    failed++;
  }
}

// =============================================
console.log('\n=== calculateScore ===\n');

// 1. Produit vide → score de base 70
{
  const { score } = calculateScore({});
  assert('Produit vide → score de base 70', score, 70);
}

// 2. Produit avec bon premier ingrédient (viande)
{
  const { score, details } = calculateScore({
    ingredients: [{ name: 'Poulet déshydraté' }, { name: 'Riz' }]
  });
  assertRange('Premier ingrédient viande → bonus qualité', score, 75, 85);
  assert('qualityBonus inclut +10 pour premier ingrédient viande', details.qualityBonus, 10);
}

// 3. Produit avec ingrédients controversés
{
  const { score, details } = calculateScore({
    ingredients: [
      { name: 'Sous-produits animaux' },
      { name: 'Farine animale' },
      { name: 'Maïs' },
      { name: 'Blé' }
    ]
  });
  assertRange('Ingrédients controversés → pénalité', score, 40, 60);
  assert('ingredientsScore diminué', details.ingredientsScore < 40, true);
}

// 4. Additifs dangereux
{
  const { score, details } = calculateScore({
    additives: [
      { code: 'E320', risk: 'dangerous' },
      { code: 'E250', risk: 'dangerous' }
    ]
  });
  assert('2 additifs dangereux → penalty 20', details.additivesPenalty, 20);
  assert('Score avec additifs dangereux = 50', score, 50);
}

// 5. Additifs modérés
{
  const { score, details } = calculateScore({
    additives: [
      { code: 'E200', risk: 'moderate' },
      { code: 'E330', risk: 'moderate' }
    ]
  });
  assert('2 additifs modérés → penalty 8', details.additivesPenalty, 8);
  assert('Score avec additifs modérés = 62', score, 62);
}

// 6. Plafond de pénalité additifs à 30
{
  const { score, details } = calculateScore({
    additives: [
      { code: 'E320' }, { code: 'E321' }, { code: 'E250' }, { code: 'E251' }
    ]
  });
  assert('Pénalité additifs plafonnée (détails)', details.additivesPenalty, 40);
  // mais seulement 30 appliqués au score
  assert('Score = 70 - 30 = 40', score, 40);
}

// 7. Score nutritionnel - haute protéine, faible gras, bonne fibre
{
  const { score, details } = calculateScore({
    scoreDetails: { protein: 30, fat: 10, fiber: 5 }
  });
  assert('Protéine > 25 → +5', details.protein, 5);
  assert('Gras < 15 → +3', details.fat, 3);
  assert('Fibre > 3 → +3', details.fiber, 3);
  assert('Score avec bon profil nutritionnel', score, 81);
}

// 8. Score nutritionnel - gras élevé
{
  const { details } = calculateScore({
    scoreDetails: { protein: 10, fat: 30, fiber: 0 }
  });
  assert('Gras > 25 → -3', details.fat, -3);
  assert('Protéine 10-15 → 0', details.protein, 0);
  assert('Fibre 0 → 0', details.fiber, 0);
}

// 9. Produit excellent (viande fraîche + légumes + pas d'additifs + bonne nutrition)
{
  const { score } = calculateScore({
    ingredients: [
      { name: 'Viande fraîche de poulet' },
      { name: 'Légumes variés' },
      { name: 'Poisson frais' }
    ],
    scoreDetails: { protein: 30, fat: 12, fiber: 4 }
  });
  assertRange('Produit excellent → score élevé', score, 85, 100);
}

// 10. Produit très mauvais
{
  const { score } = calculateScore({
    ingredients: [
      { name: 'Sous-produits animaux' },
      { name: 'Farine animale' },
      { name: 'Maïs' },
      { name: 'Blé' },
      { name: 'Soja' },
      { name: 'Colorant' }
    ],
    additives: [
      { code: 'E320' }, { code: 'E250' }, { code: 'E102' }
    ],
    scoreDetails: { protein: 8, fat: 30, fiber: 0 }
  });
  assertRange('Produit très mauvais → score bas', score, 0, 30);
}

// 11. Score borné entre 0 et 100
{
  const { score: low } = calculateScore({
    ingredients: Array(10).fill({ name: 'Sous-produits animaux', isControversial: true }),
    additives: Array(5).fill({ code: 'E320', risk: 'dangerous' }),
    scoreDetails: { protein: 0, fat: 50, fiber: 0 }
  });
  assertRange('Score minimum borné à 0', low, 0, 0);

  const { score: high } = calculateScore({
    ingredients: [
      { name: 'Viande fraîche de poulet' },
      { name: 'Poisson frais' },
      { name: 'Légumes bio' }
    ],
    scoreDetails: { protein: 35, fat: 8, fiber: 6 }
  });
  assertRange('Score maximum borné à 100', high, 0, 100);
}

// =============================================
console.log('\n=== getScoreLabel ===\n');

{
  const { label: l1, color: c1 } = getScoreLabel(90);
  assert('Score 90 → Excellent', l1, 'Excellent');
  assert('Score 90 → vert', c1, '#2ECC71');

  const { label: l2 } = getScoreLabel(65);
  assert('Score 65 → Bon', l2, 'Bon');

  const { label: l3 } = getScoreLabel(45);
  assert('Score 45 → Médiocre', l3, 'Médiocre');

  const { label: l4 } = getScoreLabel(25);
  assert('Score 25 → Mauvais', l4, 'Mauvais');

  const { label: l5 } = getScoreLabel(10);
  assert('Score 10 → Très mauvais', l5, 'Très mauvais');

  // Bornes exactes
  const { label: l6 } = getScoreLabel(80);
  assert('Score 80 → Excellent (borne)', l6, 'Excellent');

  const { label: l7 } = getScoreLabel(60);
  assert('Score 60 → Bon (borne)', l7, 'Bon');

  const { label: l8 } = getScoreLabel(40);
  assert('Score 40 → Médiocre (borne)', l8, 'Médiocre');

  const { label: l9 } = getScoreLabel(20);
  assert('Score 20 → Mauvais (borne)', l9, 'Mauvais');

  const { label: l10 } = getScoreLabel(0);
  assert('Score 0 → Très mauvais', l10, 'Très mauvais');
}

// =============================================
console.log(`\nRésultat: ${passed} passés, ${failed} échoués`);
process.exit(failed > 0 ? 1 : 0);
