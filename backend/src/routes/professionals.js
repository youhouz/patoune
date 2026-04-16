const express = require('express');
const router = express.Router();
const { search, getOne, trackContact, create, update } = require('../controllers/professionalsController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, search);
router.get('/:id', getOne);
router.post('/:id/contact', trackContact);
router.post('/', protect, create);
router.patch('/:id', protect, update);

module.exports = router;
