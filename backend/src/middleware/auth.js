const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Non autorisé, token manquant'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token invalide'
    });
  }
};

// Like protect but does not block unauthenticated requests.
// Sets req.user when a valid token is provided, otherwise continues with req.user = undefined.
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
  } catch (_) {
    // Invalid token — continue as guest
  }

  next();
};



const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Le rôle ${req.user ? req.user.role : 'invité'} n'est pas autorisé à accéder à cette route`
      });
    }
    next();
  };
};

module.exports = { protect, optionalAuth, authorize };
