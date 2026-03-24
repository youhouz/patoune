const mongoose = require('mongoose');

const visitorLogSchema = new mongoose.Schema({
  ip: {
    type: String,
    default: 'unknown',
  },
  userAgent: {
    type: String,
    default: '',
  },
  device: {
    type: String,
    enum: ['ios', 'android', 'web', 'unknown'],
    default: 'unknown',
  },
  path: {
    type: String,
    required: true,
  },
  method: {
    type: String,
    default: 'GET',
  },
  statusCode: {
    type: Number,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  country: {
    type: String,
    default: '',
  },
  city: {
    type: String,
    default: '',
  },
  referer: {
    type: String,
    default: '',
  },
  duration: {
    type: Number, // ms
    default: 0,
  },
}, {
  timestamps: true,
});

visitorLogSchema.index({ createdAt: -1 });
visitorLogSchema.index({ ip: 1, createdAt: -1 });
visitorLogSchema.index({ user: 1, createdAt: -1 });
visitorLogSchema.index({ path: 1 });
visitorLogSchema.index({ device: 1 });

module.exports = mongoose.model('VisitorLog', visitorLogSchema);
