const errorHandler = (err, req, res, next) => {
  // Logger les erreurs uniquement en développement
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, errors: messages });
  }

  // Duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      error: `Ce ${field} est déjà utilisé`
    });
  }

  // Cast error (mauvais ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Ressource non trouvée'
    });
  }

  // En production, ne jamais renvoyer le message d'erreur interne
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Erreur serveur'
    : err.message || 'Erreur serveur';

  res.status(statusCode).json({
    success: false,
    error: message
  });
};

module.exports = errorHandler;
