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
        // Compter les produits dangereux évités
        if ((product.nutritionScore || 0) < 40) {
          userDoc.badProductsAvoided = (userDoc.badProductsAvoided || 0) + 1;
        }
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

        // Retourner les infos gamification avec la réponse
        return res.json({
          success: true,
          product,
          gamification: {
            totalScans: userDoc.totalScans,
            scanStreak: userDoc.scanStreak,
            badProductsAvoided: userDoc.badProductsAvoided,
            newBadges,
            badges: userDoc.badges,
          },
        });
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

// @desc    Alternatives mieux notees pour un produit
// @route   GET /api/products/:id/alternatives
exports.getAlternatives = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Produit non trouve' });
    }

    // Chercher des produits mieux notes dans la meme categorie/animal
    const filter = {
      _id: { $ne: product._id },
      nutritionScore: { $gt: (product.nutritionScore || 0) + 10 },
    };
    if (product.category) filter.category = product.category;
    if (product.targetAnimal?.length > 0) {
      filter.targetAnimal = { $in: product.targetAnimal };
    }

    const alternatives = await Product.find(filter)
      .sort({ nutritionScore: -1 })
      .limit(3)
      .select('name brand nutritionScore category targetAnimal image')
      .lean();

    res.json({ success: true, alternatives });
  } catch (error) {
    next(error);
  }
};

// @desc    Leaderboard des meilleurs scanners
// @route   GET /api/products/leaderboard
exports.getLeaderboard = async (req, res, next) => {
  try {
    const topScanners = await User.find({ totalScans: { $gt: 0 } })
      .sort({ totalScans: -1 })
      .limit(20)
      .select('name avatar totalScans scanStreak badges referralCount')
      .lean();

    const leaderboard = topScanners.map((u, i) => ({
      rank: i + 1,
      name: u.name,
      avatar: u.avatar || null,
      totalScans: u.totalScans || 0,
      scanStreak: u.scanStreak || 0,
      badgeCount: (u.badges || []).length,
      referralCount: u.referralCount || 0,
    }));

    res.json({ success: true, leaderboard });
  } catch (error) {
    next(error);
  }
};

// @desc    Stats communautaires (social proof)
// @route   GET /api/products/community-stats
exports.getCommunityStats = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalScans, scansToday, totalProducts, totalUsers] = await Promise.all([
      ScanHistory.countDocuments(),
      ScanHistory.countDocuments({ scannedAt: { $gte: todayStart } }),
      Product.countDocuments(),
      User.countDocuments(),
    ]);

    res.json({
      success: true,
      stats: { totalScans, scansToday, totalProducts, totalUsers },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resume hebdomadaire des scans pour l'utilisateur
// @route   GET /api/products/weekly-summary
exports.getWeeklySummary = async (req, res, next) => {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const history = await ScanHistory.find({
      user: req.user.id,
      scannedAt: { $gte: weekStart },
    })
      .populate('product', 'name brand nutritionScore image category')
      .lean();

    const scansThisWeek = history.length;
    const scoresSum = history.reduce((sum, h) => sum + (h.product?.nutritionScore || 0), 0);
    const avgScore = scansThisWeek > 0 ? Math.round(scoresSum / scansThisWeek) : 0;
    const dangerousCount = history.filter(h => (h.product?.nutritionScore || 100) < 40).length;
    const excellentCount = history.filter(h => (h.product?.nutritionScore || 0) >= 80).length;

    // Best scan of the week
    const bestScan = history
      .filter(h => h.product)
      .sort((a, b) => (b.product.nutritionScore || 0) - (a.product.nutritionScore || 0))[0];

    // Scans per day (last 7 days)
    const perDay = Array(7).fill(0);
    history.forEach(h => {
      const daysAgo = Math.floor((now - new Date(h.scannedAt)) / (1000 * 60 * 60 * 24));
      if (daysAgo >= 0 && daysAgo < 7) {
        perDay[6 - daysAgo]++;
      }
    });

    res.json({
      success: true,
      summary: {
        scansThisWeek,
        avgScore,
        dangerousCount,
        excellentCount,
        bestScan: bestScan?.product || null,
        perDay,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle un produit en favori
// @route   POST /api/products/:id/favorite
exports.toggleFavorite = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouve' });
    }

    user.favoriteProducts = user.favoriteProducts || [];
    const idx = user.favoriteProducts.findIndex(p => p.toString() === productId);
    let isFavorite;
    if (idx >= 0) {
      user.favoriteProducts.splice(idx, 1);
      isFavorite = false;
    } else {
      user.favoriteProducts.push(productId);
      isFavorite = true;
    }
    await user.save();

    res.json({
      success: true,
      isFavorite,
      favoriteCount: user.favoriteProducts.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Liste des produits favoris
// @route   GET /api/products/favorites
exports.getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'favoriteProducts',
        select: 'name brand barcode nutritionScore image category targetAnimal',
      })
      .lean();

    const favorites = (user?.favoriteProducts || []).filter(Boolean);
    res.json({ success: true, count: favorites.length, favorites });
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
