const express = require('express');
const router = express.Router();
const { getMyPets, getPet, addPet, updatePet, deletePet } = require('../controllers/petController');
const { protect } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const { petValidation } = require('../utils/validators');

router.route('/')
  .get(protect, getMyPets)
  .post(protect, petValidation, addPet);

router.route('/:id')
  .get(protect, validateObjectId('id'), getPet)
  .put(protect, validateObjectId('id'), updatePet)
  .delete(protect, validateObjectId('id'), deletePet);

module.exports = router;
