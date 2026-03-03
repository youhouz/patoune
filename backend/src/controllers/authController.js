const User = require('../models/User');
const PetSitter = require('../models/PetSitter');
const { validationResult } = require('express-validator');

// @desc    Inscription
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, phone, role, address, guardianProfile } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'Cet email est déjà utilisé'
      });
    }

    // Créer l'utilisateur avec role et adresse
    const userData = { name, email, password, phone };
    if (role) userData.role = role;
    if (address) userData.address = address;

    // Si role guardian ou both, marquer isPetSitter
    if (role === 'guardian' || role === 'both') {
      userData.isPetSitter = true;
    }

    const user = await User.create(userData);

    // Auto-créer le profil PetSitter si guardian ou both
    if ((role === 'guardian' || role === 'both') && guardianProfile) {
      const sitterData = {
        user: user._id,
        bio: guardianProfile.bio || '',
        experience: guardianProfile.experience || 0,
        acceptedAnimals: guardianProfile.acceptedAnimals || [],
        services: guardianProfile.services || [],
        pricePerDay: guardianProfile.pricePerDay || 0,
        pricePerHour: guardianProfile.pricePerHour || 0
      };

      // Copier la localisation de l'utilisateur si disponible
      if (user.location && user.location.coordinates) {
        sitterData.location = user.location;
      }

      await PetSitter.create(sitterData);
    }

    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        isPetSitter: user.isPetSitter
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Connexion
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email et mot de passe requis'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides'
      });
    }

    const token = user.getSignedJwtToken();

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        isPetSitter: user.isPetSitter,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir l'utilisateur connecté
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        isPetSitter: user.isPetSitter,
        role: user.role,
        address: user.address,
        location: user.location,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};
