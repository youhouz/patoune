const Booking = require('../models/Booking');
const PetSitter = require('../models/PetSitter');
const Pet = require('../models/Pet');

// Transitions d'état autorisées
const STATE_TRANSITIONS = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['ongoing', 'cancelled'],
  ongoing:    ['completed'],
  completed:  [],
  cancelled:  [],
};

// Qui peut déclencher quelle transition
const TRANSITION_ROLES = {
  confirmed:  'sitter',   // Seul le sitter peut confirmer
  ongoing:    'sitter',   // Seul le sitter peut démarrer
  completed:  'sitter',   // Seul le sitter peut terminer
  cancelled:  'both',     // Les deux peuvent annuler
};

// @desc    Créer une réservation
// @route   POST /api/bookings
exports.createBooking = async (req, res, next) => {
  try {
    const { startDate, endDate, service, pet, sitter } = req.body;

    if (!startDate || !endDate || !service || !pet || !sitter) {
      return res.status(400).json({ success: false, error: 'Champs obligatoires manquants (startDate, endDate, service, pet, sitter)' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, error: 'Dates invalides' });
    }
    if (start >= end) {
      return res.status(400).json({ success: false, error: 'La date de debut doit etre avant la date de fin' });
    }
    if (start < new Date()) {
      return res.status(400).json({ success: false, error: 'La date de debut ne peut pas etre dans le passe' });
    }

    // Vérifier que l'animal appartient à l'utilisateur
    const petDoc = await Pet.findById(pet);
    if (!petDoc || petDoc.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Cet animal ne vous appartient pas' });
    }

    // Vérifier que le pet-sitter existe et propose le service
    const petSitter = await PetSitter.findById(sitter);
    if (!petSitter) {
      return res.status(404).json({ success: false, error: 'Pet-sitter non trouvé' });
    }
    if (!petSitter.services.includes(service)) {
      return res.status(400).json({ success: false, error: 'Ce pet-sitter ne propose pas ce service' });
    }

    // Vérifier qu'il n'y a pas déjà une réservation active pour ce sitter aux mêmes dates
    const conflicting = await Booking.findOne({
      sitter,
      status: { $in: ['pending', 'confirmed', 'ongoing'] },
      startDate: { $lt: end },
      endDate: { $gt: start },
    });
    if (conflicting) {
      return res.status(409).json({
        success: false,
        error: 'Ce pet-sitter a deja une reservation sur cette periode'
      });
    }

    // Calculer le prix côté serveur (jamais faire confiance au client)
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const isHourlyService = ['promenade', 'visite'].includes(service);
    const totalPrice = isHourlyService
      ? Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60))) * (petSitter.pricePerHour || 0)
      : days * (petSitter.pricePerDay || 0);

    const booking = await Booking.create({
      owner: req.user.id,
      sitter,
      pet,
      service,
      startDate: start,
      endDate: end,
      totalPrice,
      notes: typeof req.body.notes === 'string' ? req.body.notes.slice(0, 500) : '',
    });

    res.status(201).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir mes réservations
// @route   GET /api/bookings
exports.getMyBookings = async (req, res, next) => {
  try {
    // Trouver le profil PetSitter de l'utilisateur (s'il existe)
    const sitterProfile = await PetSitter.findOne({ user: req.user.id }).select('_id').lean();

    const orConditions = [{ owner: req.user.id }];
    if (sitterProfile) {
      orConditions.push({ sitter: sitterProfile._id });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const total = await Booking.countDocuments({ $or: orConditions });
    const bookings = await Booking.find({ $or: orConditions })
      .populate('pet', 'name species breed photos')
      .populate('owner', 'name avatar')
      .populate({
        path: 'sitter',
        populate: { path: 'user', select: 'name avatar' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ success: true, count: bookings.length, total, page, bookings });
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

    const booking = await Booking.findById(req.params.id)
      .populate({ path: 'sitter', select: 'user' });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Réservation non trouvée' });
    }

    // Identifier le rôle de l'utilisateur
    const isOwner = booking.owner.toString() === req.user.id;
    const isSitter = booking.sitter?.user?.toString() === req.user.id;

    if (!isOwner && !isSitter) {
      return res.status(403).json({ success: false, error: 'Non autorisé à modifier cette réservation' });
    }

    // Vérifier la transition d'état
    const allowed = STATE_TRANSITIONS[booking.status];
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Transition impossible : ${booking.status} -> ${status}`
      });
    }

    // Vérifier qui a le droit de faire cette transition
    const roleRequired = TRANSITION_ROLES[status];
    if (roleRequired === 'sitter' && !isSitter) {
      return res.status(403).json({ success: false, error: 'Seul le gardien peut effectuer cette action' });
    }

    booking.status = status;
    await booking.save();

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};
