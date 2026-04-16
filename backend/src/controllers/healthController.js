// ---------------------------------------------------------------------------
// Carnet de sante numerique : vaccins, vermifuges, poids, traitements.
// Partageable avec un veterinaire via healthShareToken (lecture publique).
// ---------------------------------------------------------------------------

const Pet = require('../models/Pet');
const crypto = require('crypto');

async function ownedPet(req) {
  const pet = await Pet.findById(req.params.id);
  if (!pet) return { error: 'notFound' };
  if (pet.owner.toString() !== req.user.id) return { error: 'forbidden' };
  return { pet };
}

function respond(res, result) {
  if (result.error === 'notFound') return res.status(404).json({ success: false, error: 'Animal introuvable' });
  if (result.error === 'forbidden') return res.status(403).json({ success: false, error: 'Action non autorisee' });
  return null;
}

// @desc    Recuperer le carnet de sante de son animal
// @route   GET /api/pets/:id/health
exports.getHealth = async (req, res, next) => {
  try {
    const r = await ownedPet(req);
    const err = respond(res, r); if (err) return err;
    const { pet } = r;
    res.json({
      success: true,
      health: {
        petId: pet._id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        age: pet.age,
        gender: pet.gender,
        microchip: pet.microchip,
        allergies: pet.allergies,
        vaccines: pet.vaccines,
        dewormings: pet.dewormings,
        weights: pet.weights,
        treatments: pet.treatments,
        veterinarian: pet.veterinarian,
        healthShareToken: pet.healthShareToken,
      },
    });
  } catch (err) { next(err); }
};

// @desc    Ajouter un vaccin
// @route   POST /api/pets/:id/health/vaccines
exports.addVaccine = async (req, res, next) => {
  try {
    const r = await ownedPet(req);
    const e = respond(res, r); if (e) return e;
    const { name, date, nextDue, veterinarian, batchNumber, notes } = req.body;
    if (!name || !date) return res.status(400).json({ success: false, error: 'Nom et date du vaccin requis' });
    r.pet.vaccines.push({ name, date, nextDue, veterinarian, batchNumber, notes });
    await r.pet.save();
    res.status(201).json({ success: true, vaccines: r.pet.vaccines });
  } catch (err) { next(err); }
};

// @desc    Supprimer un vaccin
// @route   DELETE /api/pets/:id/health/vaccines/:vaccineId
exports.deleteVaccine = async (req, res, next) => {
  try {
    const r = await ownedPet(req);
    const e = respond(res, r); if (e) return e;
    r.pet.vaccines = r.pet.vaccines.filter(v => v._id.toString() !== req.params.vaccineId);
    await r.pet.save();
    res.json({ success: true, vaccines: r.pet.vaccines });
  } catch (err) { next(err); }
};

// @desc    Ajouter un vermifuge / anti-parasitaire
// @route   POST /api/pets/:id/health/dewormings
exports.addDeworming = async (req, res, next) => {
  try {
    const r = await ownedPet(req);
    const e = respond(res, r); if (e) return e;
    const { product, date, nextDue, notes } = req.body;
    if (!product || !date) return res.status(400).json({ success: false, error: 'Produit et date requis' });
    r.pet.dewormings.push({ product, date, nextDue, notes });
    await r.pet.save();
    res.status(201).json({ success: true, dewormings: r.pet.dewormings });
  } catch (err) { next(err); }
};

// @desc    Enregistrer un poids
// @route   POST /api/pets/:id/health/weights
exports.addWeight = async (req, res, next) => {
  try {
    const r = await ownedPet(req);
    const e = respond(res, r); if (e) return e;
    const { weight, date, notes } = req.body;
    if (typeof weight !== 'number' || weight <= 0) {
      return res.status(400).json({ success: false, error: 'Poids invalide' });
    }
    r.pet.weights.push({ weight, date: date ? new Date(date) : new Date(), notes });
    r.pet.weight = weight; // keep main field in sync with latest
    await r.pet.save();
    res.status(201).json({ success: true, weights: r.pet.weights });
  } catch (err) { next(err); }
};

// @desc    Ajouter un traitement / ordonnance
// @route   POST /api/pets/:id/health/treatments
exports.addTreatment = async (req, res, next) => {
  try {
    const r = await ownedPet(req);
    const e = respond(res, r); if (e) return e;
    const { name, type, startDate, endDate, dosage, prescribedBy, notes } = req.body;
    if (!name || !startDate) return res.status(400).json({ success: false, error: 'Nom et date de debut requis' });
    r.pet.treatments.push({ name, type, startDate, endDate, dosage, prescribedBy, notes });
    await r.pet.save();
    res.status(201).json({ success: true, treatments: r.pet.treatments });
  } catch (err) { next(err); }
};

// @desc    Mettre a jour allergies, puce, coordonnees veterinaire
// @route   PATCH /api/pets/:id/health
exports.updateHealthInfo = async (req, res, next) => {
  try {
    const r = await ownedPet(req);
    const e = respond(res, r); if (e) return e;
    const { microchip, allergies, veterinarian } = req.body;
    if (typeof microchip === 'string') r.pet.microchip = microchip;
    if (Array.isArray(allergies)) r.pet.allergies = allergies.filter(Boolean);
    if (veterinarian && typeof veterinarian === 'object') {
      r.pet.veterinarian = {
        name: veterinarian.name || '',
        phone: veterinarian.phone || '',
        address: veterinarian.address || '',
        email: veterinarian.email || '',
      };
    }
    await r.pet.save();
    res.json({ success: true, pet: r.pet });
  } catch (err) { next(err); }
};

// @desc    Regenerer le token de partage (le precedent est invalide)
// @route   POST /api/pets/:id/health/share/rotate
exports.rotateShareToken = async (req, res, next) => {
  try {
    const r = await ownedPet(req);
    const e = respond(res, r); if (e) return e;
    r.pet.healthShareToken = crypto.randomBytes(8).toString('hex');
    await r.pet.save();
    res.json({ success: true, healthShareToken: r.pet.healthShareToken });
  } catch (err) { next(err); }
};

// @desc    Vue publique du carnet (read-only) via token
// @route   GET /api/pets/public-health/:token
exports.getPublicHealth = async (req, res, next) => {
  try {
    const pet = await Pet.findOne({ healthShareToken: req.params.token }).lean();
    if (!pet) return res.status(404).json({ success: false, error: 'Lien invalide' });
    res.json({
      success: true,
      health: {
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        age: pet.age,
        gender: pet.gender,
        microchip: pet.microchip,
        allergies: pet.allergies,
        vaccines: pet.vaccines,
        dewormings: pet.dewormings,
        weights: pet.weights,
        treatments: pet.treatments,
        veterinarian: pet.veterinarian,
      },
    });
  } catch (err) { next(err); }
};
