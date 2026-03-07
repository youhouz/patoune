const Booking = require('../models/Booking');

// @desc    Créer une réservation
// @route   POST /api/bookings
exports.createBooking = async (req, res, next) => {
  try {
    req.body.owner = req.user.id;
    const booking = await Booking.create(req.body);

    res.status(201).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir mes réservations
// @route   GET /api/bookings
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      $or: [
        { owner: req.user.id },
        { sitter: req.user.id }
      ]
    })
      .populate('pet', 'name species breed photos')
      .populate('owner', 'name avatar')
      .populate({
        path: 'sitter',
        populate: { path: 'user', select: 'name avatar' }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Changer le statut d'une réservation
// @route   PUT /api/bookings/:id/status
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'ongoing', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Statut invalide' });
    }

    const booking = await Booking.findById(req.params.id).populate('sitter');

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Réservation non trouvée' });
    }

    // Seul le propriétaire ou le gardien peut modifier le statut
    const sitterUserId = booking.sitter?.user?.toString();
    const isOwner = booking.owner.toString() === req.user.id;
    const isSitter = sitterUserId === req.user.id;

    if (!isOwner && !isSitter) {
      return res.status(403).json({ success: false, error: 'Non autorisé à modifier cette réservation' });
    }

    booking.status = status;
    await booking.save();

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};
