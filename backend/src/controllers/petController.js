const Pet = require('../models/Pet');
const { validationResult } = require('express-validator');

// Champs autorisés pour création/modification d'un animal
const ALLOWED_PET_FIELDS = [
  'name', 'species', 'breed', 'age', 'weight', 'gender',
  'specialNeeds', 'vaccinated', 'sterilized', 'photos', 'description'
];

function pickFields(body, fields) {
  const picked = {};
  for (const key of fields) {
    if (body[key] !== undefined) picked[key] = body[key];
  }
  return picked;
}

// @desc    Obtenir mes animaux
// @route   GET /api/pets
exports.getMyPets = async (req, res, next) => {
  try {
    const pets = await Pet.find({ owner: req.user.id }).lean();
    res.json({ success: true, count: pets.length, pets });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir un animal
// @route   GET /api/pets/:id
exports.getPet = async (req, res, next) => {
  try {
    const pet = await Pet.findById(req.params.id).lean();
    if (!pet) {
      return res.status(404).json({ success: false, error: 'Animal non trouvé' });
    }
    if (pet.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }
    res.json({ success: true, pet });
  } catch (error) {
    next(error);
  }
};

// @desc    Ajouter un animal
// @route   POST /api/pets
exports.addPet = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const petData = pickFields(req.body, ALLOWED_PET_FIELDS);
    petData.owner = req.user.id;
    const pet = await Pet.create(petData);
    res.status(201).json({ success: true, pet });
  } catch (error) {
    next(error);
  }
};

// @desc    Modifier un animal
// @route   PUT /api/pets/:id
exports.updatePet = async (req, res, next) => {
  try {
    let pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ success: false, error: 'Animal non trouvé' });
    }

    if (pet.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    // Whitelist des champs (jamais owner, _id, etc.)
    const updates = pickFields(req.body, ALLOWED_PET_FIELDS);
    pet = await Pet.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, pet });
  } catch (error) {
    next(error);
  }
};

// @desc    Supprimer un animal
// @route   DELETE /api/pets/:id
exports.deletePet = async (req, res, next) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ success: false, error: 'Animal non trouvé' });
    }

    if (pet.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    await pet.deleteOne();
    res.json({ success: true, message: 'Animal supprimé' });
  } catch (error) {
    next(error);
  }
};
