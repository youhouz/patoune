const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  petsitter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetSitter',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'La note est requise'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: [500, 'Le commentaire ne peut pas dépasser 500 caractères'],
    default: ''
  }
}, {
  timestamps: true
});

// Un seul avis par booking
reviewSchema.index({ author: 1, booking: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
