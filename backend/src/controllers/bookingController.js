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
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Réservation non trouvée' });
    }

    booking.status = status;
    await booking.save();

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};
