const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: {
    type: String,
    default: 'anonyme',
  },
  category: {
    type: String,
    enum: ['bug', 'feature', 'other'],
    default: 'bug',
  },
  title: {
    type: String,
    trim: true,
    default: '',
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    maxlength: 2000,
  },
  screenshots: [{
    type: String, // base64 data URIs
  }],
  platform: {
    type: String,
    default: 'unknown',
  },
  status: {
    type: String,
    enum: ['new', 'read', 'resolved'],
    default: 'new',
  },
}, {
  timestamps: true,
});

feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ status: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
