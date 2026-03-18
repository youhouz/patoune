const express = require('express');
const router = express.Router();
const { searchPetSitters, getPetSitter, becomePetSitter, updatePetSitter } = require('../controllers/petsitterController');
const { protect } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

router.get('/', protect, searchPetSitters);
router.get('/:id', protect, validateObjectId('id'), getPetSitter);
router.post('/', protect, becomePetSitter);
router.put('/me', protect, updatePetSitter);

module.exports = router;
