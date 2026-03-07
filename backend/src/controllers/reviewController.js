const Review = require('../models/Review');
const PetSitter = require('../models/PetSitter');
const Booking = require('../models/Booking');

// @desc    Laisser un avis
// @route   POST /api/reviews
exports.createReview = async (req, res, next) => {
  try {
    const { petsitter, booking: bookingId, rating, comment } = req.body;

    if (!petsitter || !bookingId || !rating) {
      return res.status(400).json({
        success: false,
        error: 'Les champs petsitter, booking et rating sont requis'
      });
    }

    // Vérifier que la réservation existe et appartient à l'utilisateur
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Réservation non trouvée' });
    }
    if (booking.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Vous ne pouvez noter que vos propres réservations' });
    }
    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, error: 'Vous ne pouvez noter qu\'une réservation terminée' });
    }

    const review = await Review.create({
      author: req.user.id,
      petsitter,
      booking: bookingId,
      rating,
      comment: comment || ''
    });

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
