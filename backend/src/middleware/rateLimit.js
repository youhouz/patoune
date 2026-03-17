/**
 * Simple in-memory rate limiter middleware.
 * For production with multiple instances, use a Redis-backed limiter.
 *
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default 15 min)
 * @param {number} options.max - Max requests per window per IP (default 10)
 */
module.exports = function rateLimit({ windowMs = 15 * 60 * 1000, max = 10 } = {}) {
  const hits = new Map();

  // Periodically clean up old entries
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now - entry.start > windowMs) {
        hits.delete(key);
      }
    }
  }, windowMs);
  cleanup.unref();

  return (req, res, next) => {
    // req.ip utilise X-Forwarded-For quand 'trust proxy' est activé sur Express
    const key = req.ip || 'unknown';
    const now = Date.now();

    let entry = hits.get(key);
    if (!entry || now - entry.start > windowMs) {
      entry = { count: 1, start: now };
      hits.set(key, entry);
      return next();
    }

    entry.count++;
    if (entry.count > max) {
      const retryAfterMs = windowMs - (now - entry.start);
      res.set('Retry-After', Math.ceil(retryAfterMs / 1000));
      return res.status(429).json({
        success: false,
        error: 'Trop de tentatives. Reessaie plus tard.'
      });
    }

    next();
  };
};
