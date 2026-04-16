const express = require('express');
const router = express.Router();
const { ask } = require('../controllers/aiController');
const { optionalAuth } = require('../middleware/auth');
const { enforceQuota } = require('../middleware/quota');

// POST /api/ai/ask - Accessible sans inscription (mode invité)
// Quota 5/jour pour les comptes gratuits, illimite pour Pepete Plus.
router.post('/ask', optionalAuth, enforceQuota('ai'), ask);

module.exports = router;
