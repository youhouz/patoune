const express = require('express');
const router = express.Router();
const { createReview, getPetSitterReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

router.post('/', protect, createReview);
router.get('/petsitter/:id', protect, validateObjectId('id'), getPetSitterReviews);

module.exports = router;
