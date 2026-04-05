const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, "L'email est requis"],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email invalide']
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [8, 'Le mot de passe doit faire au moins 8 caractères'],
    select: false
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  isPetSitter: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'guardian', 'both', 'admin'],
    default: 'user'
  },
  address: {
    street: String,
    city: String,
    postalCode: String,
    country: { type: String, default: 'France' }
  },
  pushSubscriptions: [{
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String,
    },
  }],
  // Système de parrainage
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  referralCount: {
    type: Number,
    default: 0,
  },
  // Gamification
  scanStreak: {
    type: Number,
    default: 0,
  },
  lastScanDate: {
    type: Date,
    default: null,
  },
  totalScans: {
    type: Number,
    default: 0,
  },
  badges: [{
    type: String,
  }],
}, {
  timestamps: true
});

// Index géospatial
userSchema.index({ location: '2dsphere' });

// Générer un code de parrainage unique à la création
userSchema.pre('save', async function (next) {
  if (this.isNew && !this.referralCode) {
    const prefix = (this.name || 'PEP').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'P');
    const suffix = this._id.toString().slice(-4).toUpperCase();
    this.referralCode = `${prefix}${suffix}`;
  }
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Vérifier password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Générer JWT
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

module.exports = mongoose.model('User', userSchema);
