const User = require('../models/User');

// @desc    Obtenir le profil
// @route   GET /api/users/me
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Modifier le profil
// @route   PUT /api/users/me
exports.updateProfile = async (req, res, next) => {
  try {
    // Whitelist des champs modifiables (pas de role, email, password ici)
    const { name, phone, location } = req.body;
    const updates = {};

    if (name && typeof name === 'string') updates.name = name.trim().slice(0, 50);
    if (phone && typeof phone === 'string') updates.phone = phone.trim().slice(0, 20);
    if (location && location.coordinates) updates.location = location;

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload avatar (base64 data URI stored in MongoDB)
// @route   PUT /api/users/me/avatar
exports.uploadAvatar = async (req, res, next) => {
  try {
    const { avatar } = req.body;
    if (!avatar) {
      return res.status(400).json({
        success: false,
        error: 'Aucune image fournie'
      });
    }

    // Valider le format (uniquement jpeg, png, webp)
    if (!/^data:image\/(jpeg|jpg|png|webp);base64,/.test(avatar)) {
      return res.status(400).json({
        success: false,
        error: 'Format d\'image invalide (jpeg, png ou webp uniquement)'
      });
    }

    // Limiter à 2MB de base64 (~1.5MB d'image réelle)
    if (avatar.length > 2 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Image trop volumineuse (max 1.5MB)'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar },
      { new: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
