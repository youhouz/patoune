// ---------------------------------------------------------------------------
// Annuaire des professionnels : veterinaires, toiletteurs, educateurs, etc.
// Revenu : abonnement "Pro Boost" (9,99 EUR/mois) pour apparaitre en haut.
// ---------------------------------------------------------------------------

const mongoose = require('mongoose');

const professionalSchema = new mongoose.Schema({
  // Lien vers un compte User si le pro est inscrit (sinon null — fiche ajoutee par equipe)
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },

  type: {
    type: String,
    required: true,
    enum: ['veterinaire', 'toiletteur', 'educateur', 'comportementaliste', 'dresseur', 'petshop', 'pension', 'osteopathe'],
    index: true,
  },
  name: { type: String, required: true, trim: true, index: 'text' },
  description: { type: String, default: '' },

  // Coordonnees
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  website: { type: String, default: '' },

  // Adresse + geo
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: 'France' },
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },

  // Metier
  services: [{ type: String, trim: true }],
  acceptedAnimals: [{ type: String, enum: ['chien', 'chat', 'rongeur', 'oiseau', 'reptile', 'poisson', 'autre', 'tous'] }],

  // Horaires (JSON simple : { lundi: "9h-18h", ... })
  hours: { type: Map, of: String, default: {} },

  // Urgence / astreinte
  emergency: { type: Boolean, default: false },

  // Tarification indicative (EUR)
  priceRange: {
    min: { type: Number, default: null },
    max: { type: Number, default: null },
  },

  photos: [{ type: String }],
  logo: { type: String, default: '' },

  verified: { type: Boolean, default: false, index: true },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },

  // ─── Boost paye (via Stripe) ─────────────────────────
  // Apparait en tete des resultats tant que featuredUntil > now
  featuredUntil: { type: Date, default: null, index: true },

  // Stats
  views: { type: Number, default: 0 },
  contacts: { type: Number, default: 0 },
}, { timestamps: true });

professionalSchema.index({ location: '2dsphere' });
professionalSchema.index({ type: 1, verified: -1 });

// Virtual : est actuellement "featured"
professionalSchema.virtual('isFeatured').get(function () {
  return this.featuredUntil && this.featuredUntil.getTime() > Date.now();
});

professionalSchema.set('toJSON', { virtuals: true });
professionalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Professional', professionalSchema);
