const express = require('express');
const router = express.Router();
const { scanProduct, addProduct, getScanHistory, searchProducts, getPopularProducts, getCommunityStats } = require('../controllers/productController');
const { protect, optionalAuth } = require('../middleware/auth');

// Scan & search are accessible without login (guest mode)
router.get('/popular', getPopularProducts);
router.get('/community-stats', getCommunityStats);
router.get('/scan/:barcode', optionalAuth, scanProduct);
router.get('/search', optionalAuth, searchProducts);
// History & adding products require authentication
router.post('/', protect, addProduct);
router.get('/history', protect, getScanHistory);

module.exports = router;
