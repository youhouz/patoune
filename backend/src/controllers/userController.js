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
    const { name, phone, location } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (location) updates.location = location;

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

    // Validate it's a data URI image
    if (!avatar.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: 'Format d\'image invalide'
      });
    }

    // Check size (~1.3x base64 overhead, limit to ~4MB of base64 = ~3MB image)
    if (avatar.length > 4 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Image trop volumineuse (max 3MB)'
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
