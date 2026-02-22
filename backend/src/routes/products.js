const express = require('express');
const router = express.Router();
const { scanProduct, addProduct, getScanHistory, searchProducts } = require('../controllers/productController');
const { protect } = require('../middleware/auth');

router.get('/scan/:barcode', protect, scanProduct);
router.post('/', protect, addProduct);
router.get('/history', protect, getScanHistory);
router.get('/search', protect, searchProducts);

module.exports = router;
