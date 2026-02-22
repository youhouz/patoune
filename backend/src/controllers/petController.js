const Pet = require('../models/Pet');

// @desc    Obtenir mes animaux
// @route   GET /api/pets
exports.getMyPets = async (req, res, next) => {
  try {
    const pets = await Pet.find({ owner: req.user.id });
    res.json({ success: true, count: pets.length, pets });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir un animal
// @route   GET /api/pets/:id
exports.getPet = async (req, res, next) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ success: false, error: 'Animal non trouvé' });
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
    req.body.owner = req.user.id;
    const pet = await Pet.create(req.body);
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

    pet = await Pet.findByIdAndUpdate(req.params.id, req.body, {
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
