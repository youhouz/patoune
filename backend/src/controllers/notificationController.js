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

// @desc    Envoyer un rappel de scan quotidien aux utilisateurs inactifs
// @route   POST /api/notifications/daily-reminder (protege par cron secret)
exports.sendDailyReminders = async (req, res, next) => {
  try {
    const secret = req.headers['x-cron-secret'] || req.body.cronSecret;
    if (secret !== process.env.CRON_SECRET) {
      return res.status(403).json({ success: false, error: 'Acces refuse' });
    }

    const ScanHistory = require('../models/ScanHistory');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Trouver les utilisateurs avec push ET qui n'ont pas scanne aujourd'hui
    const usersWithPush = await User.find({
      'pushSubscriptions.0': { $exists: true },
    }).select('_id pushSubscriptions scanStreak lastScanDate');

    // Filtrer ceux qui n'ont pas scanne aujourd'hui
    const inactiveUsers = usersWithPush.filter(u => {
      if (!u.lastScanDate) return true;
      return new Date(u.lastScanDate) < todayStart;
    });

    let sent = 0;
    const messages = [
      { title: 'Ton animal compte sur toi !', body: 'Scanne ses croquettes pour verifier leur qualite.' },
      { title: 'As-tu scanne aujourd\'hui ?', body: 'Continue ta serie et debloque de nouveaux badges !' },
      { title: 'Nouvelle journee, nouveau scan !', body: 'Protege la sante de ton compagnon en 2 secondes.' },
    ];

    for (const u of inactiveUsers) {
      const msg = messages[Math.floor(Math.random() * messages.length)];
      const streakMsg = (u.scanStreak || 0) >= 3
        ? { title: `Serie de ${u.scanStreak} jours !`, body: 'Ne perds pas ta serie, scanne un produit maintenant.' }
        : msg;
      try {
        await exports.sendPushToUser(u._id, { ...streakMsg, url: '/' });
        sent++;
      } catch (_) {}
    }

    res.json({ success: true, sent, total: inactiveUsers.length });
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
