const express = require('express');
const router = express.Router();
const { getMyPets, getPet, addPet, updatePet, deletePet } = require('../controllers/petController');
const {
  getHealth, addVaccine, deleteVaccine, addDeworming, addWeight, addTreatment,
  updateHealthInfo, rotateShareToken, getPublicHealth,
} = require('../controllers/healthController');
const { protect } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const { petValidation } = require('../utils/validators');

router.route('/')
  .get(protect, getMyPets)
  .post(protect, petValidation, addPet);

// Vue publique du carnet de sante (lien partage avec veterinaire)
router.get('/public-health/:token', getPublicHealth);

router.route('/:id')
  .get(protect, validateObjectId('id'), getPet)
  .put(protect, validateObjectId('id'), updatePet)
  .delete(protect, validateObjectId('id'), deletePet);

// ─── Carnet de sante ─────────────────────────────────────────────
router.get   ('/:id/health',                         protect, validateObjectId('id'), getHealth);
router.patch ('/:id/health',                         protect, validateObjectId('id'), updateHealthInfo);
router.post  ('/:id/health/vaccines',                protect, validateObjectId('id'), addVaccine);
router.delete('/:id/health/vaccines/:vaccineId',     protect, validateObjectId('id'), deleteVaccine);
router.post  ('/:id/health/dewormings',              protect, validateObjectId('id'), addDeworming);
router.post  ('/:id/health/weights',                 protect, validateObjectId('id'), addWeight);
router.post  ('/:id/health/treatments',              protect, validateObjectId('id'), addTreatment);
router.post  ('/:id/health/share/rotate',            protect, validateObjectId('id'), rotateShareToken);

module.exports = router;
