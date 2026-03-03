const express = require('express');
const router = express.Router();
const { ask } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// POST /api/ai/ask - Poser une question à l'assistant IA (authentifié)
router.post('/ask', protect, ask);

module.exports = router;
