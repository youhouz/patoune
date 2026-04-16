const mongoose = require('mongoose');

// Journal de tous les paiements Stripe (abonnements + one-shot).
// Source de verite = Stripe ; ce modele sert l'historique/reconciliation.
const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  stripeCustomerId: { type: String, index: true },
  stripeSubscriptionId: { type: String, index: true },
  stripeInvoiceId: { type: String, index: true, unique: true, sparse: true },
  stripeCheckoutSessionId: { type: String, index: true },
  stripePaymentIntentId: { type: String, index: true },

  // Plan souscrit au moment du paiement
  plan: { type: String, enum: ['monthly', 'yearly', 'one_time', null], default: null },

  // Montants en centimes (Stripe-native)
  amount: { type: Number, required: true },
  currency: { type: String, default: 'eur' },

  // 'succeeded' | 'pending' | 'failed' | 'refunded'
  status: { type: String, required: true },

  paidAt: { type: Date, default: null },
  periodStart: { type: Date, default: null },
  periodEnd: { type: Date, default: null },

  receiptUrl: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
