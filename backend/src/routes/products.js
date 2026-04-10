const express = require('express');
const router = express.Router();
const {
  scanProduct, addProduct, getScanHistory, searchProducts,
  getPopularProducts, getCommunityStats, getAlternatives,
  getLeaderboard, getMonthlyLeaderboard, toggleFavorite, getFavorites,
  getWeeklySummary, getPublicProduct,
  getProductsByBrand, getProductsByAnimal, getAllBrands, getSitemapData, getDangerousIngredients,
} = require('../controllers/productController');
const { protect, optionalAuth } = require('../middleware/auth');

// Scan & search are accessible without login (guest mode)
router.get('/popular', getPopularProducts);
router.get('/community-stats', getCommunityStats);
router.get('/public/:barcode', getPublicProduct);
// SEO endpoints (public, no auth)
router.get('/brand/:brand', getProductsByBrand);
router.get('/animal/:animal', getProductsByAnimal);
router.get('/brands', getAllBrands);
router.get('/sitemap-data', getSitemapData);
router.get('/dangerous-ingredients', getDangerousIngredients);
router.get('/leaderboard', getLeaderboard);
router.get('/monthly-leaderboard', optionalAuth, getMonthlyLeaderboard);
router.get('/favorites', protect, getFavorites);
router.get('/weekly-summary', protect, getWeeklySummary);
router.post('/:id/favorite', protect, toggleFavorite);
router.get('/:id/alternatives', getAlternatives);
router.get('/scan/:barcode', optionalAuth, scanProduct);
router.get('/search', optionalAuth, searchProducts);
// History & adding products require authentication
router.post('/', protect, addProduct);
router.get('/history', protect, getScanHistory);

module.exports = router;
