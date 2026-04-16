const express = require('express');
const router = express.Router();
const { listPartners, trackClick } = require('../controllers/insuranceController');
const { optionalAuth } = require('../middleware/auth');

router.get('/partners', listPartners);
router.post('/click', optionalAuth, trackClick);

module.exports = router;
