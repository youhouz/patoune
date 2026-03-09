const PetSitter = require('../models/PetSitter');
const User = require('../models/User');

// Champs autorisés pour la création/modification d'un profil gardien
// Exclut: rating, reviewCount, verified (champs gérés par le système)
const ALLOWED_SITTER_FIELDS = [
  'bio', 'experience', 'acceptedAnimals', 'services',
  'pricePerDay', 'pricePerHour', 'availability', 'location', 'radius', 'photos'
];

function pickAllowedFields(body) {
  const picked = {};
  for (const key of ALLOWED_SITTER_FIELDS) {
    if (body[key] !== undefined) picked[key] = body[key];
  }
  return picked;
}

// Echapper les caractères spéciaux regex pour éviter les attaques ReDoS
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// @desc    Rechercher des gardiens (géolocalisé avec distance)
// @route   GET /api/petsitters?lat=&lng=&radius=&animal=&service=&search=
exports.searchPetSitters = async (req, res, next) => {
  try {
    const { lat, lng, radius = 10, animal, service, search } = req.query;

    // Si coordonnées fournies, utiliser $geoNear pour obtenir la distance
    if (lat && lng) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      if (isNaN(parsedLat) || isNaN(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
        return res.status(400).json({ success: false, error: 'Coordonnées géographiques invalides' });
      }
      const maxDistanceMeters = Math.min(parseInt(radius) || 10, 100) * 1000;
      const pipeline = [];

      // Étape $geoNear (doit être la première étape du pipeline)
      pipeline.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parsedLng, parsedLat]
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
        matchStage.bio = { $regex: escapeRegex(search), $options: 'i' };
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

      // Convertir la distance de metres en km (le frontend attend des km)
      petsitters = petsitters.map(sitter => ({
        ...sitter,
        distance: parseFloat((sitter.distance / 1000).toFixed(2))
      }));

      return res.json({ success: true, count: petsitters.length, petsitters });
    }

    // Sans coordonnées : recherche classique sans distance
    const filter = {};
    if (animal) filter.acceptedAnimals = animal;
    if (service) filter.services = service;
    if (search) {
      filter.bio = { $regex: escapeRegex(search), $options: 'i' };
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

    const sitterData = pickAllowedFields(req.body);
    sitterData.user = req.user.id;
    const petsitter = await PetSitter.create(sitterData);

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

    const updates = pickAllowedFields(req.body);
    petsitter = await PetSitter.findByIdAndUpdate(petsitter._id, updates, {
      new: true,
      runValidators: true
    }).populate('user', 'name avatar');

    res.json({ success: true, petsitter });
  } catch (error) {
    next(error);
  }
};
