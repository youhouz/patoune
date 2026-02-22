const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
  },
  startTime: String,
  endTime: String
}, { _id: false });

const petSitterSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bio: {
    type: String,
    maxlength: [500, 'La bio ne peut pas dépasser 500 caractères'],
    default: ''
  },
  experience: {
    type: Number,
    default: 0
  },
  acceptedAnimals: [{
    type: String,
    enum: ['chien', 'chat', 'rongeur', 'oiseau', 'reptile', 'poisson', 'autre']
  }],
  services: [{
    type: String,
    enum: ['garde_domicile', 'garde_chez_sitter', 'promenade', 'visite', 'toilettage']
  }],
  pricePerDay: {
    type: Number,
    default: 0
  },
  pricePerHour: {
    type: Number,
    default: 0
  },
  availability: [availabilitySchema],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  radius: {
    type: Number,
    default: 10
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  photos: [{
    type: String
  }]
}, {
  timestamps: true
});

petSitterSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('PetSitter', petSitterSchema);
