const express = require('express');
const router = express.Router();
const {
  create, list, getOne, getPublic, addSighting, setStatus, listMine,
} = require('../controllers/lostPetsController');
const { protect, optionalAuth } = require('../middleware/auth');

// Public (pas d'auth requise pour chercher / voir)
router.get('/', list);
router.get('/mine', protect, listMine);
router.get('/public/:shareToken', getPublic);
router.get('/:id', getOne);

// Auth requise pour declarer / modifier
router.post('/', protect, create);
router.post('/:id/sightings', optionalAuth, addSighting); // signalement possible sans compte
router.patch('/:id/status', protect, setStatus);

module.exports = router;
