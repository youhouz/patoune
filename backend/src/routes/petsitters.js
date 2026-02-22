const express = require('express');
const router = express.Router();
const { searchPetSitters, getPetSitter, becomePetSitter, updatePetSitter } = require('../controllers/petsitterController');
const { protect } = require('../middleware/auth');

router.get('/', protect, searchPetSitters);
router.get('/:id', protect, getPetSitter);
router.post('/', protect, becomePetSitter);
router.put('/me', protect, updatePetSitter);

module.exports = router;
