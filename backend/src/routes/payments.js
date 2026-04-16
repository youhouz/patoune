const express = require('express');
const router = express.Router();
const {
  getStatus,
  createCheckoutSession,
  createPortalSession,
} = require('../controllers/paymentsController');
const { protect } = require('../middleware/auth');

// Le webhook est monte separement dans server.js avec express.raw()
// (doit arriver AVANT express.json() pour que la signature soit verifiable).

router.get('/status', protect, getStatus);
router.post('/create-checkout-session', protect, createCheckoutSession);
router.post('/portal', protect, createPortalSession);

module.exports = router;
