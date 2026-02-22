const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, "Le nom de l'animal est requis"],
    trim: true
  },
  species: {
    type: String,
    required: [true, "L'espèce est requise"],
    enum: ['chien', 'chat', 'rongeur', 'oiseau', 'reptile', 'poisson', 'autre']
  },
  breed: {
    type: String,
    trim: true,
    default: ''
  },
  age: {
    type: Number,
    min: 0
  },
  weight: {
    type: Number,
    min: 0
  },
  gender: {
    type: String,
    enum: ['male', 'femelle'],
    required: true
  },
  specialNeeds: {
    type: String,
    default: ''
  },
  vaccinated: {
    type: Boolean,
    default: false
  },
  photos: [{
    type: String
  }],
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Pet', petSchema);
