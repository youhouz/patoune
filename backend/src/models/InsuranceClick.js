const mongoose = require('mongoose');

// Trace chaque clic sur une offre assurance pour facturer les partenaires
// (modele CPC/CPA) et mesurer la conversion.
const insuranceClickSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  partner: { type: String, required: true, index: true }, // ex: 'santevet', 'dalma', 'bullebleue'
  source: { type: String, default: 'app' }, // 'app' | 'landing' | 'email'
  animalSpecies: { type: String, default: '' },
  animalAge: { type: Number, default: null },
  ip: { type: String, default: '' },
}, { timestamps: true });

insuranceClickSchema.index({ partner: 1, createdAt: -1 });

module.exports = mongoose.model('InsuranceClick', insuranceClickSchema);
