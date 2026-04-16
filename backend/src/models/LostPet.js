// ---------------------------------------------------------------------------
// Animal perdu — alerte geolocalisee. Objectif : ramener l'animal a la maison.
// Acquisition virale : chaque alerte partageable genere des visites entrantes.
// ---------------------------------------------------------------------------

const mongoose = require('mongoose');
const crypto = require('crypto');

const sightingSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reporterName: { type: String, default: '' },
  reporterPhone: { type: String, default: '' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },
  address: { type: String, default: '' },
  photo: { type: String, default: '' },
  notes: { type: String, default: '' },
  seenAt: { type: Date, default: Date.now },
}, { _id: true, timestamps: true });

const lostPetSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    default: null, // optional: user may not have the pet registered
  },

  // Snapshot de l'animal au moment de la declaration (utile si l'animal est supprime plus tard)
  name: { type: String, required: true, trim: true },
  species: {
    type: String,
    required: true,
    enum: ['chien', 'chat', 'rongeur', 'oiseau', 'reptile', 'poisson', 'autre'],
  },
  breed: { type: String, default: '' },
  color: { type: String, default: '' },
  age: { type: Number, min: 0 },
  gender: { type: String, enum: ['male', 'femelle', 'inconnu'], default: 'inconnu' },
  microchip: { type: String, default: '' }, // numero de puce
  distinctiveSigns: { type: String, default: '' },
  photos: [{ type: String }],

  // Contexte de la perte
  lostAt: { type: Date, required: true, default: Date.now },
  lastSeenLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },
  lastSeenAddress: { type: String, default: '' },
  circumstances: { type: String, default: '' },

  // Contact de la personne a joindre
  contactName: { type: String, required: true },
  contactPhone: { type: String, required: true },
  contactEmail: { type: String, default: '' },

  reward: { type: Number, default: 0 }, // recompense en EUR (optionnel)

  status: {
    type: String,
    enum: ['active', 'found', 'cancelled'],
    default: 'active',
    index: true,
  },
  foundAt: { type: Date, default: null },

  // Token public pour partage sans authentification (lien WhatsApp/FB)
  shareToken: { type: String, unique: true, sparse: true, index: true },

  views: { type: Number, default: 0 },
  sightings: [sightingSchema],
}, { timestamps: true });

lostPetSchema.index({ lastSeenLocation: '2dsphere' });
lostPetSchema.index({ status: 1, lostAt: -1 });

// Token de partage genere a la creation
lostPetSchema.pre('save', function (next) {
  if (this.isNew && !this.shareToken) {
    this.shareToken = crypto.randomBytes(6).toString('hex');
  }
  next();
});

module.exports = mongoose.model('LostPet', lostPetSchema);
