const express = require('express');
const router = express.Router();
const { subscribe, unsubscribe, getVapidKey, sendDailyReminders } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// GET /api/notifications/vapid-key - Get VAPID public key (public)
router.get('/vapid-key', getVapidKey);

// POST /api/notifications/subscribe - Subscribe to push notifications
router.post('/subscribe', protect, subscribe);

// POST /api/notifications/unsubscribe - Unsubscribe from push notifications
router.post('/unsubscribe', protect, unsubscribe);

// POST /api/notifications/daily-reminder - Send daily scan reminders (cron)
router.post('/daily-reminder', sendDailyReminders);

module.exports = router;
