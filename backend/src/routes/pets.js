const express = require('express');
const router = express.Router();
const { getMyPets, getPet, addPet, updatePet, deletePet } = require('../controllers/petController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getMyPets)
  .post(protect, addPet);

router.route('/:id')
  .get(protect, getPet)
  .put(protect, updatePet)
  .delete(protect, deletePet);

module.exports = router;
