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

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        error: 'La note doit etre un entier entre 1 et 5'
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

    // Vérifier que le petsitter correspond à la réservation
    if (booking.sitter.toString() !== petsitter) {
      return res.status(400).json({ success: false, error: 'Le pet-sitter ne correspond pas à cette réservation' });
    }

    // Vérifier qu'un avis n'a pas déjà été laissé pour cette réservation
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ success: false, error: 'Un avis a déjà été laissé pour cette réservation' });
    }

    const review = await Review.create({
      author: req.user.id,
      petsitter,
      booking: bookingId,
      rating: ratingNum,
      comment: typeof comment === 'string' ? comment.slice(0, 1000) : ''
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
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const total = await Review.countDocuments({ petsitter: req.params.id });
    const reviews = await Review.find({ petsitter: req.params.id })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ success: true, count: reviews.length, total, page, reviews });
  } catch (error) {
    next(error);
  }
};
