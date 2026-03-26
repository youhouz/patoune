const express = require('express');
const router = express.Router();
const { subscribe, unsubscribe, getVapidKey } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// GET /api/notifications/vapid-key - Get VAPID public key (public)
router.get('/vapid-key', getVapidKey);

// POST /api/notifications/subscribe - Subscribe to push notifications
router.post('/subscribe', protect, subscribe);

// POST /api/notifications/unsubscribe - Unsubscribe from push notifications
router.post('/unsubscribe', protect, unsubscribe);

module.exports = router;
