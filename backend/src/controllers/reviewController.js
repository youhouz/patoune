const Review = require('../models/Review');
const PetSitter = require('../models/PetSitter');

// @desc    Laisser un avis
// @route   POST /api/reviews
exports.createReview = async (req, res, next) => {
  try {
    req.body.author = req.user.id;
    const review = await Review.create(req.body);

    // Recalculer la note moyenne du gardien
    const reviews = await Review.find({ petsitter: req.body.petsitter });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await PetSitter.findByIdAndUpdate(req.body.petsitter, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length
    });

    res.status(201).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

// @desc    Avis d'un gardien
// @route   GET /api/reviews/petsitter/:id
exports.getPetSitterReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ petsitter: req.params.id })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};
