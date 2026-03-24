const VisitorLog = require('../models/VisitorLog');

/**
 * Detect device from user-agent string.
 */
function detectDevice(ua) {
  if (!ua) return 'unknown';
  const lower = ua.toLowerCase();
  if (lower.includes('iphone') || lower.includes('ipad') || lower.includes('ios')) return 'ios';
  if (lower.includes('android')) return 'android';
  if (lower.includes('mozilla') || lower.includes('chrome') || lower.includes('safari')) return 'web';
  return 'unknown';
}

/**
 * Extract real IP from request (handles proxies, Vercel, Cloudflare).
 */
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.headers['cf-connecting-ip'] ||
    req.ip ||
    req.connection?.remoteAddress ||
    'unknown'
  );
}

/**
 * Analytics middleware — logs every API call asynchronously.
 * Non-blocking: does not slow down requests.
 */
const analyticsTracker = (req, res, next) => {
  // Skip health checks and admin analytics to avoid noise
  if (req.path === '/api/health' || req.path.startsWith('/api/admin/analytics')) {
    return next();
  }

  const startTime = Date.now();

  // Hook into response finish to capture status code + duration
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Fire-and-forget — don't await, don't block
    VisitorLog.create({
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
      device: detectDevice(req.headers['user-agent']),
      path: req.path,
      method: req.method,
      statusCode: res.statusCode,
      user: req.user?._id || null,
      referer: req.headers['referer'] || req.headers['referrer'] || '',
      duration,
    }).catch(() => {
      // Silently ignore logging errors — never break the app
    });
  });

  next();
};

module.exports = { analyticsTracker, getClientIp, detectDevice };
