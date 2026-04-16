// ---------------------------------------------------------------------------
// Free tier quotas. Premium users (Pepete Plus) bypass all limits.
// Guests (no token) are already rate-limited in aiController (5/h).
// ---------------------------------------------------------------------------

const User = require('../models/User');

const LIMITS = {
  ai: 5,    // AI questions per day (free)
  scan: 10, // Product scans per day (free)
};

// Reset daily counters if we are past the next midnight.
function shouldReset(user) {
  if (!user.quotaResetAt) return true;
  return user.quotaResetAt.getTime() <= Date.now();
}

function nextMidnight() {
  const d = new Date();
  d.setHours(24, 0, 0, 0); // tomorrow 00:00 local server time
  return d;
}

// Returns an Express middleware that enforces the given quota key.
// If the user has no token (guest), we let through — other layers (like the
// AI in-memory rate limit) handle that case.
function enforceQuota(key) {
  const limit = LIMITS[key];
  const counterField = key === 'ai' ? 'aiQueriesToday' : 'scansToday';

  return async function quotaMiddleware(req, res, next) {
    if (!req.user) return next(); // guest — skip, handled elsewhere

    try {
      const user = await User.findById(req.user.id);
      if (!user) return next();

      // Premium = no limit
      if (user.isPremium && user.isPremium()) {
        return next();
      }

      // Reset daily counters
      if (shouldReset(user)) {
        user.aiQueriesToday = 0;
        user.scansToday = 0;
        user.quotaResetAt = nextMidnight();
      }

      const current = user[counterField] || 0;
      if (current >= limit) {
        return res.status(402).json({
          success: false,
          error: key === 'ai'
            ? `Limite gratuite atteinte : ${limit} questions par jour. Passez a Pepete Plus pour des questions illimitees.`
            : `Limite gratuite atteinte : ${limit} scans par jour. Passez a Pepete Plus pour scanner sans limite.`,
          code: 'QUOTA_EXCEEDED',
          feature: key,
          limit,
          used: current,
          upgrade: {
            url: '/payments/create-checkout-session',
            plans: ['monthly', 'yearly'],
          },
        });
      }

      // Increment and persist
      user[counterField] = current + 1;
      await user.save();

      // Expose remaining quota to downstream handlers if they want to display it
      req.quota = {
        feature: key,
        limit,
        used: user[counterField],
        remaining: Math.max(0, limit - user[counterField]),
        isPremium: false,
      };
      next();
    } catch (err) {
      // Never block the request on a quota tracking error
      console.error('[quota] error:', err.message);
      next();
    }
  };
}

module.exports = { enforceQuota, LIMITS };
