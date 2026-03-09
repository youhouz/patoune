const express = require('express');
const router = express.Router();
const { ask } = require('../controllers/aiController');
const { optionalAuth } = require('../middleware/auth');

// POST /api/ai/ask - Accessible sans inscription (mode invité)
router.post('/ask', optionalAuth, ask);

module.exports = router;
