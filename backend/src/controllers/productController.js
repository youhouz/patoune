const Product = require('../models/Product');
const ScanHistory = require('../models/ScanHistory');
const User = require('../models/User');
const { calculateScore } = require('../utils/scoreCalculator');
const { fetchProductFromOpenFoodFacts } = require('../utils/openFoodFacts');

// Champs autorisés pour la contribution communautaire
const ALLOWED_PRODUCT_FIELDS = [
  'barcode', 'name', 'brand', 'category', 'targetAnimal',
  'ingredients', 'additives', 'image', 'description'
];

function pickFields(body, fields) {
  const picked = {};
  for (const key of fields) {
    if (body[key] !== undefined) picked[key] = body[key];
  }
  return picked;
}

// @desc    Scanner un produit par code-barres
// @route   GET /api/products/scan/:barcode
exports.scanProduct = async (req, res, next) => {
  try {
    let product = await Product.findOne({ barcode: req.params.barcode });

    // Si pas en base locale, chercher sur Open Food Facts
    if (!product) {
      const offData = await fetchProductFromOpenFoodFacts(req.params.barcode);

      if (offData) {
        offData.addedBy = req.user ? req.user.id : undefined;
        product = await Product.create(offData);
      } else {
        return res.status(404).json({
          success: false,
          error: 'Produit non trouve dans nos bases (Open Food Facts + Open Pet Food Facts). Verifiez le code-barres ou ajoutez ce produit !'
        });
      }
    }

    // Recalculer le score si les champs breakdown manquent (produits anciens)
    if (product.scoreDetails && product.scoreDetails.ingredientsScore == null) {
      const scoreResult = calculateScore(product.toObject ? product.toObject() : product);
      product.nutritionScore = scoreResult.score;
      product.scoreDetails = scoreResult.details;
      await product.save();
    }

    // Sauvegarder dans l'historique + mettre à jour les stats gamification
    if (req.user) {
      await ScanHistory.create({
        user: req.user.id,
        product: product._id
      });

      // Mettre à jour streak et totalScans
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const userDoc = await User.findById(req.user.id);
      if (userDoc) {
        userDoc.totalScans = (userDoc.totalScans || 0) + 1;
        if (userDoc.lastScanDate) {
          const lastDate = new Date(userDoc.lastScanDate);
          const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
          const diffDays = Math.round((today - lastDay) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            userDoc.scanStreak = (userDoc.scanStreak || 0) + 1;
          } else if (diffDays > 1) {
            userDoc.scanStreak = 1;
          }
          // Same day: keep streak unchanged
        } else {
          userDoc.scanStreak = 1;
        }
        userDoc.lastScanDate = now;

        // Auto-attribution de badges
        const badges = userDoc.badges || [];
        const newBadges = [];
        if (userDoc.totalScans >= 1 && !badges.includes('first_scan')) newBadges.push('first_scan');
        if (userDoc.totalScans >= 10 && !badges.includes('scanner_10')) newBadges.push('scanner_10');
        if (userDoc.totalScans >= 50 && !badges.includes('scanner_50')) newBadges.push('scanner_50');
        if (userDoc.totalScans >= 100 && !badges.includes('scanner_100')) newBadges.push('scanner_100');
        if (userDoc.scanStreak >= 3 && !badges.includes('streak_3')) newBadges.push('streak_3');
        if (userDoc.scanStreak >= 7 && !badges.includes('streak_7')) newBadges.push('streak_7');
        if (userDoc.scanStreak >= 30 && !badges.includes('streak_30')) newBadges.push('streak_30');
        if (newBadges.length > 0) userDoc.badges.push(...newBadges);

        await userDoc.save();
      }
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

    // Whitelist des champs (jamais nutritionScore, scoreDetails, addedBy directement)
    const productData = pickFields(req.body, ALLOWED_PRODUCT_FIELDS);
    productData.addedBy = req.user.id;

    // Calculer le score automatiquement
    if (productData.ingredients || productData.additives) {
      const scoreData = calculateScore(productData);
      productData.nutritionScore = scoreData.score;
      productData.scoreDetails = scoreData.details;
    }

    const product = await Product.create(productData);
    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Historique de scans
// @route   GET /api/products/history
exports.getScanHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const total = await ScanHistory.countDocuments({ user: req.user.id });
    const history = await ScanHistory.find({ user: req.user.id })
      .populate('product', 'name brand barcode nutritionScore image category')
      .sort({ scannedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({ success: true, count: history.length, total, page, history });
  } catch (error) {
    next(error);
  }
};

// @desc    Produits les plus scannés (publique)
// @route   GET /api/products/popular
exports.getPopularProducts = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 12, 50);
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
        .select('name brand nutritionScore category targetAnimal image')
        .lean();
      const existingIds = new Set(popular.map(p => p._id.toString()));
      const extras = topRated
        .filter(p => !existingIds.has(p._id.toString()))
        .map(p => ({ ...p, scanCount: 0 }));
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
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
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

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ nutritionScore: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({ success: true, count: products.length, total, page, products });
  } catch (error) {
    next(error);
  }
};
