const PetSitter = require('../models/PetSitter');
const User = require('../models/User');

// @desc    Rechercher des gardiens (géolocalisé avec distance)
// @route   GET /api/petsitters?lat=&lng=&radius=&animal=&service=&search=
exports.searchPetSitters = async (req, res, next) => {
  try {
    const { lat, lng, radius = 10, animal, service, search } = req.query;

    // Si coordonnées fournies, utiliser $geoNear pour obtenir la distance
    if (lat && lng) {
      const maxDistanceMeters = parseInt(radius) * 1000;
      const pipeline = [];

      // Étape $geoNear (doit être la première étape du pipeline)
      pipeline.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          distanceField: 'distance',
          maxDistance: maxDistanceMeters,
          spherical: true
        }
      });

      // Filtres supplémentaires via $match
      const matchStage = {};
      if (animal) matchStage.acceptedAnimals = animal;
      if (service) matchStage.services = service;
      if (search) {
        matchStage.bio = { $regex: search, $options: 'i' };
      }

      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }

      // Limiter les résultats
      pipeline.push({ $limit: 20 });

      let petsitters = await PetSitter.aggregate(pipeline);

      // Populate le champ user après l'agrégation
      petsitters = await PetSitter.populate(petsitters, {
        path: 'user',
        select: 'name avatar'
      });

      // Arrondir la distance en mètres
      petsitters = petsitters.map(sitter => ({
        ...sitter,
        distance: Math.round(sitter.distance)
      }));

      return res.json({ success: true, count: petsitters.length, petsitters });
    }

    // Sans coordonnées : recherche classique sans distance
    const filter = {};
    if (animal) filter.acceptedAnimals = animal;
    if (service) filter.services = service;
    if (search) {
      filter.bio = { $regex: search, $options: 'i' };
    }

    const petsitters = await PetSitter.find(filter)
      .populate('user', 'name avatar')
      .limit(20);

    res.json({ success: true, count: petsitters.length, petsitters });
  } catch (error) {
    next(error);
  }
};

// @desc    Détail d'un gardien
// @route   GET /api/petsitters/:id
exports.getPetSitter = async (req, res, next) => {
  try {
    const petsitter = await PetSitter.findById(req.params.id)
      .populate('user', 'name avatar email phone');

    if (!petsitter) {
      return res.status(404).json({ success: false, error: 'Gardien non trouvé' });
    }

    res.json({ success: true, petsitter });
  } catch (error) {
    next(error);
  }
};

// @desc    Devenir gardien
// @route   POST /api/petsitters
exports.becomePetSitter = async (req, res, next) => {
  try {
    const existingSitter = await PetSitter.findOne({ user: req.user.id });
    if (existingSitter) {
      return res.status(400).json({
        success: false,
        error: 'Vous êtes déjà enregistré comme gardien'
      });
    }

    req.body.user = req.user.id;
    const petsitter = await PetSitter.create(req.body);

    // Marquer l'utilisateur comme pet sitter
    await User.findByIdAndUpdate(req.user.id, { isPetSitter: true });

    res.status(201).json({ success: true, petsitter });
  } catch (error) {
    next(error);
  }
};

// @desc    Modifier son profil gardien
// @route   PUT /api/petsitters/me
exports.updatePetSitter = async (req, res, next) => {
  try {
    let petsitter = await PetSitter.findOne({ user: req.user.id });
    if (!petsitter) {
      return res.status(404).json({
        success: false,
        error: "Vous n'êtes pas enregistré comme gardien"
      });
    }

    petsitter = await PetSitter.findByIdAndUpdate(petsitter._id, req.body, {
      new: true,
      runValidators: true
    }).populate('user', 'name avatar');

    res.json({ success: true, petsitter });
  } catch (error) {
    next(error);
  }
};
