const mongoose = require('mongoose');

const scanHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  scannedAt: {
    type: Date,
    default: Date.now
  }
});

scanHistorySchema.index({ user: 1, scannedAt: -1 });

module.exports = mongoose.model('ScanHistory', scanHistorySchema);
