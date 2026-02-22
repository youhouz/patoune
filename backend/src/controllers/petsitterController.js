const PetSitter = require('../models/PetSitter');
const User = require('../models/User');

// @desc    Rechercher des gardiens (géolocalisé)
// @route   GET /api/petsitters?lat=&lng=&radius=&animal=
exports.searchPetSitters = async (req, res, next) => {
  try {
    const { lat, lng, radius = 10, animal, service } = req.query;
    const filter = {};

    // Recherche géolocalisée
    if (lat && lng) {
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius) * 1000 // km → mètres
        }
      };
    }

    if (animal) filter.acceptedAnimals = animal;
    if (service) filter.services = service;

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
