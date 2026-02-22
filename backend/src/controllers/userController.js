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

// @desc    Upload avatar
// @route   PUT /api/users/me/avatar
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucune image fournie'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: `/uploads/${req.file.filename}` },
      { new: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
