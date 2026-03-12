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

// @desc    Produits les plus scannés (publique)
// @route   GET /api/products/popular
exports.getPopularProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    // Agréger ScanHistory pour compter les scans par produit
    const popular = await ScanHistory.aggregate([
      { $group: { _id: '$product', scanCount: { $sum: 1 } } },
      { $sort: { scanCount: -1 } },
      { $limit: limit },
      { $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
      }},
      { $unwind: '$product' },
      { $project: {
          _id: '$product._id',
          name: '$product.name',
          brand: '$product.brand',
          nutritionScore: '$product.nutritionScore',
          category: '$product.category',
          targetAnimal: '$product.targetAnimal',
          image: '$product.image',
          scanCount: 1
      }}
    ]);

    // Fallback: si pas assez de scans, compléter avec les mieux notés
    if (popular.length < 6) {
      const topRated = await Product.find({})
        .sort({ nutritionScore: -1 })
        .limit(limit)
        .select('name brand nutritionScore category targetAnimal image');
      const existingIds = new Set(popular.map(p => p._id.toString()));
      const extras = topRated
        .filter(p => !existingIds.has(p._id.toString()))
        .map(p => ({ ...p.toObject(), scanCount: 0 }));
      popular.push(...extras.slice(0, limit - popular.length));
    }

    res.json({ success: true, count: popular.length, products: popular });
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
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { brand: { $regex: escaped, $options: 'i' } }
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
