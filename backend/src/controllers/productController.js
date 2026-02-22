const Product = require('../models/Product');
const ScanHistory = require('../models/ScanHistory');
const { calculateScore } = require('../utils/scoreCalculator');
const { fetchProductFromOpenFoodFacts } = require('../utils/openFoodFacts');

// @desc    Scanner un produit par code-barres
// @route   GET /api/products/scan/:barcode
exports.scanProduct = async (req, res, next) => {
  try {
    let product = await Product.findOne({ barcode: req.params.barcode });

    // Si pas en base locale, chercher sur Open Food Facts
    if (!product) {
      console.log(`Produit ${req.params.barcode} non trouve en local, recherche sur Open Food Facts...`);
      const offData = await fetchProductFromOpenFoodFacts(req.params.barcode);

      if (offData) {
        // Sauvegarder en base pour les prochains scans
        offData.addedBy = req.user ? req.user.id : undefined;
        product = await Product.create(offData);
        console.log(`Produit trouve et sauvegarde: ${product.name} (score: ${product.nutritionScore})`);
      } else {
        return res.status(404).json({
          success: false,
          error: 'Produit non trouve. Vous pouvez contribuer en ajoutant ce produit !'
        });
      }
    }

    // Sauvegarder dans l'historique si l'utilisateur est connecte
    if (req.user) {
      await ScanHistory.create({
        user: req.user.id,
        product: product._id
      });
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Ajouter un produit (contribution communautaire)
// @route   POST /api/products
exports.addProduct = async (req, res, next) => {
  try {
    const existingProduct = await Product.findOne({ barcode: req.body.barcode });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        error: 'Ce produit existe déjà dans la base'
      });
    }

    req.body.addedBy = req.user.id;

    // Calculer le score automatiquement
    if (req.body.ingredients || req.body.additives) {
      const scoreData = calculateScore(req.body);
      req.body.nutritionScore = scoreData.score;
      req.body.scoreDetails = scoreData.details;
    }

    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Historique de scans
// @route   GET /api/products/history
exports.getScanHistory = async (req, res, next) => {
  try {
    const history = await ScanHistory.find({ user: req.user.id })
      .populate('product', 'name brand barcode nutritionScore image category')
      .sort({ scannedAt: -1 })
      .limit(50);

    res.json({ success: true, count: history.length, history });
  } catch (error) {
    next(error);
  }
};

// @desc    Rechercher des produits
// @route   GET /api/products/search?q=
exports.searchProducts = async (req, res, next) => {
  try {
    const { q, category, animal } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } }
      ];
    }
    if (category) filter.category = category;
    if (animal) filter.targetAnimal = animal;

    const products = await Product.find(filter)
      .sort({ nutritionScore: -1 })
      .limit(20);

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    next(error);
  }
};
