const LostPet = require('../models/LostPet');

// @desc    Declarer un animal perdu
// @route   POST /api/lost-pets
exports.create = async (req, res, next) => {
  try {
    const {
      pet,
      name, species, breed, color, age, gender, microchip, distinctiveSigns, photos,
      lostAt, lat, lng, lastSeenAddress, circumstances,
      contactName, contactPhone, contactEmail, reward,
    } = req.body;

    if (!name || !species || !contactName || !contactPhone) {
      return res.status(400).json({
        success: false,
        error: 'Nom, espece, contact et telephone sont obligatoires.'
      });
    }

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Position du dernier lieu vu requise (lat, lng).'
      });
    }

    const lostPet = await LostPet.create({
      owner: req.user.id,
      pet: pet || null,
      name, species, breed, color, age, gender, microchip, distinctiveSigns,
      photos: Array.isArray(photos) ? photos.slice(0, 6) : [],
      lostAt: lostAt ? new Date(lostAt) : new Date(),
      lastSeenLocation: { type: 'Point', coordinates: [lng, lat] },
      lastSeenAddress: lastSeenAddress || '',
      circumstances: circumstances || '',
      contactName, contactPhone, contactEmail,
      reward: Math.max(0, Number(reward) || 0),
    });

    res.status(201).json({ success: true, lostPet });
  } catch (err) {
    next(err);
  }
};

// @desc    Rechercher les animaux perdus (geo + filtres), liste publique
// @route   GET /api/lost-pets?lat=&lng=&radiusKm=&species=
exports.list = async (req, res, next) => {
  try {
    const { species, status = 'active' } = req.query;
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radiusKm = Math.min(500, Math.max(1, parseFloat(req.query.radiusKm) || 25));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));

    const filter = { status };
    if (species) filter.species = species;

    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      filter.lastSeenLocation = {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radiusKm * 1000,
        },
      };
    }

    const lostPets = await LostPet.find(filter)
      .sort({ lostAt: -1 })
      .limit(limit)
      .select('-sightings')
      .lean();

    res.json({ success: true, count: lostPets.length, lostPets });
  } catch (err) {
    next(err);
  }
};

// @desc    Detail d'un signalement
// @route   GET /api/lost-pets/:id
exports.getOne = async (req, res, next) => {
  try {
    const lostPet = await LostPet.findById(req.params.id).lean();
    if (!lostPet) {
      return res.status(404).json({ success: false, error: 'Signalement introuvable' });
    }
    // Incrementer vues (best-effort)
    LostPet.updateOne({ _id: lostPet._id }, { $inc: { views: 1 } }).catch(() => {});
    res.json({ success: true, lostPet });
  } catch (err) {
    next(err);
  }
};

// @desc    Page publique partageable (via shareToken)
// @route   GET /api/lost-pets/public/:shareToken
exports.getPublic = async (req, res, next) => {
  try {
    const lostPet = await LostPet.findOne({ shareToken: req.params.shareToken })
      .select('-contactEmail -sightings.reporterPhone')
      .lean();
    if (!lostPet) {
      return res.status(404).json({ success: false, error: 'Lien invalide' });
    }
    LostPet.updateOne({ _id: lostPet._id }, { $inc: { views: 1 } }).catch(() => {});
    res.json({ success: true, lostPet });
  } catch (err) {
    next(err);
  }
};

// @desc    Signaler qu'on a apercu l'animal
// @route   POST /api/lost-pets/:id/sightings
exports.addSighting = async (req, res, next) => {
  try {
    const { reporterName, reporterPhone, lat, lng, address, photo, notes } = req.body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ success: false, error: 'Position requise (lat, lng).' });
    }

    const lostPet = await LostPet.findById(req.params.id);
    if (!lostPet) {
      return res.status(404).json({ success: false, error: 'Signalement introuvable' });
    }
    if (lostPet.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Ce signalement est cloture.' });
    }

    lostPet.sightings.push({
      reporter: req.user ? req.user.id : undefined,
      reporterName: reporterName || (req.user ? req.user.name : '') || '',
      reporterPhone: reporterPhone || '',
      location: { type: 'Point', coordinates: [lng, lat] },
      address: address || '',
      photo: photo || '',
      notes: notes || '',
      seenAt: new Date(),
    });

    await lostPet.save();
    res.status(201).json({ success: true, sighting: lostPet.sightings[lostPet.sightings.length - 1] });
  } catch (err) {
    next(err);
  }
};

// @desc    Marquer retrouve / annule
// @route   PATCH /api/lost-pets/:id/status  { status: 'found' | 'cancelled' }
exports.setStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'found', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Statut invalide' });
    }

    const lostPet = await LostPet.findById(req.params.id);
    if (!lostPet) {
      return res.status(404).json({ success: false, error: 'Signalement introuvable' });
    }
    if (lostPet.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Action non autorisee' });
    }

    lostPet.status = status;
    if (status === 'found') lostPet.foundAt = new Date();
    await lostPet.save();

    res.json({ success: true, lostPet });
  } catch (err) {
    next(err);
  }
};

// @desc    Lister mes signalements
// @route   GET /api/lost-pets/mine
exports.listMine = async (req, res, next) => {
  try {
    const lostPets = await LostPet.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, count: lostPets.length, lostPets });
  } catch (err) {
    next(err);
  }
};
