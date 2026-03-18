const mongoose = require('mongoose');

/**
 * Middleware to validate MongoDB ObjectId in route params.
 * Usage: router.get('/:id', validateObjectId('id'), handler)
 */
module.exports = function validateObjectId(...paramNames) {
  return (req, res, next) => {
    for (const param of paramNames) {
      const value = req.params[param];
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return res.status(400).json({
          success: false,
          error: `Identifiant invalide : ${param}`
        });
      }
    }
    next();
  };
};
