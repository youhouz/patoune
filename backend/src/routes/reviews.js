const express = require('express');
const router = express.Router();
const { createReview, getPetSitterReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createReview);
router.get('/petsitter/:id', protect, getPetSitterReviews);

module.exports = router;
