/**
 * Tests pour formatProduct (openFoodFacts.js)
 * On teste la transformation des données Open Food Facts vers notre schéma,
 * sans appeler l'API externe.
 */

// On a besoin d'accéder à formatProduct qui n'est pas exporté directement.
// On va le tester indirectement en mockant axios puis en appelant fetchProductFromOpenFoodFacts.
// Mais c'est plus simple de re-require le module après un mock.

// Approche : on crée un mini-mock d'axios pour intercepter les appels réseau.
const path = require('path');

let passed = 0;
let failed = 0;

function assert(label, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    console.error(`    attendu: ${JSON.stringify(expected)}`);
    console.error(`    reçu:    ${JSON.stringify(actual)}`);
    failed++;
  }
}

function assertTruthy(label, value) {
  if (value) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label} — valeur falsy: ${JSON.stringify(value)}`);
    failed++;
  }
}

// Mock axios avant de require openFoodFacts
let mockResponses = {};
const originalResolve = require.resolve;

// Simple mock: on remplace axios dans le module cache
const axiosMock = {
  get: async (url, opts) => {
    for (const [pattern, response] of Object.entries(mockResponses)) {
      if (url.includes(pattern)) {
        if (response.error) throw new Error(response.error);
        return { data: response };
      }
    }
    throw new Error(`No mock for ${url}`);
  }
};

// Inject mock
require.cache[require.resolve('axios')] = {
  id: require.resolve('axios'),
  filename: require.resolve('axios'),
  loaded: true,
  exports: axiosMock,
};

// Now require openFoodFacts with mocked axios
const { fetchProductFromOpenFoodFacts } = require('./openFoodFacts');

async function runTests() {
  console.log('\n=== fetchProductFromOpenFoodFacts ===\n');

  // Test 1: Produit trouvé sur Open Pet Food Facts
  {
    mockResponses = {
      'openpetfoodfacts': {
        status: 1,
        product: {
          product_name: 'Croquettes Premium Chien',
          brands: 'PetBrand',
          categories: 'Nourriture pour chien, Dog food',
          ingredients: [
            { text: 'Poulet déshydraté' },
            { text: 'Riz' },
            { text: 'Légumes' }
          ],
          additives_tags: ['en:e330', 'en:e306'],
          nutriments: { proteins_100g: 28, fat_100g: 14, fiber_100g: 4 },
          image_url: 'https://example.com/img.jpg'
        }
      },
      'openfoodfacts': { status: 0 }
    };

    const result = await fetchProductFromOpenFoodFacts('1234567890');
    assertTruthy('Produit trouvé sur OPFF', result);
    assert('Nom du produit', result.name, 'Croquettes Premium Chien');
    assert('Marque', result.brand, 'PetBrand');
    assert('Barcode transmis', result.barcode, '1234567890');
    assert('Catégorie alimentation', result.category, 'alimentation');
    assertTruthy('Target animal contient chien', result.targetAnimal.includes('chien'));
    assert('3 ingrédients', result.ingredients.length, 3);
    assert('Premier ingrédient = Poulet déshydraté', result.ingredients[0].name, 'Poulet déshydraté');
    assert('2 additifs', result.additives.length, 2);
    assertTruthy('Score calculé (nombre)', typeof result.nutritionScore === 'number');
    assertTruthy('Score entre 0 et 100', result.nutritionScore >= 0 && result.nutritionScore <= 100);
    assert('Image URL', result.image, 'https://example.com/img.jpg');
  }

  // Test 2: Fallback sur Open Food Facts quand OPFF échoue
  {
    mockResponses = {
      'openpetfoodfacts': { error: 'Network error' },
      'openfoodfacts': {
        status: 1,
        product: {
          product_name: 'Pâtée Chat Saumon',
          brands: 'CatFood',
          categories: 'Nourriture pour chat',
          ingredients: [{ text: 'Saumon' }, { text: 'Eau' }],
          additives_tags: [],
          nutriments: { proteins_100g: 12, fat_100g: 8, fiber_100g: 1 },
          image_url: ''
        }
      }
    };

    const result = await fetchProductFromOpenFoodFacts('9999999999');
    assertTruthy('Fallback sur OFF réussi', result);
    assert('Nom produit OFF', result.name, 'Pâtée Chat Saumon');
    assertTruthy('Target animal contient chat', result.targetAnimal.includes('chat'));
  }

  // Test 3: Produit non trouvé nulle part
  {
    mockResponses = {
      'openpetfoodfacts': { status: 0 },
      'openfoodfacts': { status: 0 }
    };

    const result = await fetchProductFromOpenFoodFacts('0000000000');
    assert('Produit non trouvé → null', result, null);
  }

  // Test 4: Classification des ingrédients dangereux
  {
    mockResponses = {
      'openpetfoodfacts': {
        status: 1,
        product: {
          product_name: 'Croquettes Bas de Gamme',
          brands: 'Cheap',
          categories: 'dog food',
          ingredients: [
            { text: 'Sous-produits animaux' },
            { text: 'Farine animale' },
            { text: 'BHA' },
            { text: 'Riz complet' }
          ],
          additives_tags: ['en:e320', 'en:e250'],
          nutriments: {},
        }
      }
    };

    const result = await fetchProductFromOpenFoodFacts('1111111111');
    assertTruthy('Produit avec ingrédients dangereux trouvé', result);

    const dangerousIngs = result.ingredients.filter(i => i.risk === 'dangerous');
    assertTruthy('Au moins 1 ingrédient dangerous', dangerousIngs.length >= 1);

    const safeIngs = result.ingredients.filter(i => i.risk === 'safe');
    assertTruthy('Au moins 1 ingrédient safe (Riz)', safeIngs.length >= 1);

    const dangerousAdds = result.additives.filter(a => a.risk === 'dangerous');
    assert('2 additifs dangereux (E320, E250)', dangerousAdds.length, 2);

    assertTruthy('Score bas pour mauvais produit', result.nutritionScore < 50);
  }

  // Test 5: ingredients_text fallback quand pas d'ingredients structurés
  {
    mockResponses = {
      'openpetfoodfacts': {
        status: 1,
        product: {
          product_name: 'Produit Simple',
          brands: '',
          categories: '',
          ingredients_text: 'poulet, riz, maïs, sel',
          additives_tags: [],
          nutriments: {},
        }
      }
    };

    const result = await fetchProductFromOpenFoodFacts('2222222222');
    assertTruthy('Fallback ingredients_text', result);
    assert('4 ingrédients depuis texte', result.ingredients.length, 4);
    assertTruthy('Premier ingrédient = poulet', result.ingredients[0].name === 'poulet');
  }

  // Test 6: Détection catégorie soin/hygiène
  {
    mockResponses = {
      'openpetfoodfacts': {
        status: 1,
        product: {
          product_name: 'Shampoo chien',
          brands: 'PetCare',
          categories: 'Shampoo, hygiene pour animaux',
          ingredients: [],
          additives_tags: [],
          nutriments: {},
        }
      }
    };

    const result = await fetchProductFromOpenFoodFacts('3333333333');
    assert('Catégorie hygiène détectée', result.category, 'hygiene');
  }

  // Test 7: Animal cible par défaut "tous"
  {
    mockResponses = {
      'openpetfoodfacts': {
        status: 1,
        product: {
          product_name: 'Aliment générique',
          brands: '',
          categories: 'nourriture animale',
          ingredients: [{ text: 'viande' }],
          additives_tags: [],
          nutriments: {},
        }
      }
    };

    const result = await fetchProductFromOpenFoodFacts('4444444444');
    assert('Animal cible par défaut = tous', result.targetAnimal, ['tous']);
  }

  // =============================================
  console.log(`\nRésultat: ${passed} passés, ${failed} échoués`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
