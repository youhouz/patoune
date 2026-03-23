const mongoose = require('mongoose');

const preLaunchSubscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email invalide'],
  },
  userType: {
    type: String,
    enum: ['proprietaire', 'petsitter', 'veterinaire', 'commercant'],
    required: [true, 'Le type d\'utilisateur est requis'],
  },
  name: {
    type: String,
    trim: true,
    default: '',
  },
  city: {
    type: String,
    trim: true,
    default: '',
  },
  source: {
    type: String,
    default: 'landing',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('PreLaunchSubscriber', preLaunchSubscriberSchema);
