const webpush = require('web-push');
const User = require('../models/User');

// Configure web-push with VAPID keys
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(
    'mailto:contact@pepete.fr',
    VAPID_PUBLIC,
    VAPID_PRIVATE
  );
}

// @desc    Get VAPID public key
// @route   GET /api/notifications/vapid-key
exports.getVapidKey = (req, res) => {
  res.json({ success: true, key: VAPID_PUBLIC || '' });
};

// @desc    Subscribe to push notifications
// @route   POST /api/notifications/subscribe
exports.subscribe = async (req, res, next) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint || !subscription?.keys) {
      return res.status(400).json({ success: false, error: 'Subscription invalide' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'Utilisateur non trouve' });

    // Avoid duplicate subscriptions
    const exists = user.pushSubscriptions?.some(s => s.endpoint === subscription.endpoint);
    if (!exists) {
      user.pushSubscriptions = user.pushSubscriptions || [];
      user.pushSubscriptions.push({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      });
      await user.save();
    }

    res.json({ success: true, message: 'Notifications activees' });
  } catch (error) {
    next(error);
  }
};

// @desc    Unsubscribe from push notifications
// @route   POST /api/notifications/unsubscribe
exports.unsubscribe = async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ success: false, error: 'Endpoint requis' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { pushSubscriptions: { endpoint } },
    });

    res.json({ success: true, message: 'Notifications desactivees' });
  } catch (error) {
    next(error);
  }
};

// @desc    Send push notification to a user
// @param   {string} userId - Recipient user ID
// @param   {object} payload - { title, body, url, icon }
exports.sendPushToUser = async (userId, payload) => {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;

  try {
    const user = await User.findById(userId).select('pushSubscriptions');
    if (!user?.pushSubscriptions?.length) return;

    const data = JSON.stringify({
      title: payload.title || 'Pepete',
      body: payload.body || '',
      url: payload.url || '/',
      icon: '/assets/icon.png',
    });

    const results = await Promise.allSettled(
      user.pushSubscriptions.map(sub =>
        webpush.sendNotification(sub, data).catch(async (err) => {
          // Remove invalid subscriptions (expired, unsubscribed)
          if (err.statusCode === 410 || err.statusCode === 404) {
            await User.findByIdAndUpdate(userId, {
              $pull: { pushSubscriptions: { endpoint: sub.endpoint } },
            });
          }
        })
      )
    );
    return results;
  } catch (err) {
    console.error('[Push] Error:', err.message);
  }
};
