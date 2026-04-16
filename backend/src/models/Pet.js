const mongoose = require('mongoose');
const crypto = require('crypto');

// ─── Sous-schemas du carnet de sante ──────────────────────────────
const vaccineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  nextDue: { type: Date, default: null },
  veterinarian: { type: String, default: '' },
  batchNumber: { type: String, default: '' },
  notes: { type: String, default: '' },
}, { _id: true, timestamps: true });

const dewormingSchema = new mongoose.Schema({
  product: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  nextDue: { type: Date, default: null },
  notes: { type: String, default: '' },
}, { _id: true, timestamps: true });

const weightEntrySchema = new mongoose.Schema({
  weight: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true, default: Date.now },
  notes: { type: String, default: '' },
}, { _id: true, timestamps: true });

const treatmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, default: '' }, // medicament, chirurgie, autre
  startDate: { type: Date, required: true },
  endDate: { type: Date, default: null },
  dosage: { type: String, default: '' },
  prescribedBy: { type: String, default: '' },
  notes: { type: String, default: '' },
}, { _id: true, timestamps: true });

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
  sterilized: {
    type: Boolean,
    default: false
  },
  photos: [{
    type: String
  }],
  description: {
    type: String,
    default: ''
  },

  // ─── Carnet de sante numerique ────────────────────────────────
  microchip: { type: String, default: '' },
  allergies: [{ type: String, trim: true }],
  vaccines: [vaccineSchema],
  dewormings: [dewormingSchema],
  weights: [weightEntrySchema],
  treatments: [treatmentSchema],
  veterinarian: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  // Token pour partager le carnet de sante avec un veterinaire (lecture seule)
  healthShareToken: { type: String, unique: true, sparse: true, index: true },
}, {
  timestamps: true
});

petSchema.index({ owner: 1 });

petSchema.pre('save', function (next) {
  if (this.isNew && !this.healthShareToken) {
    this.healthShareToken = crypto.randomBytes(8).toString('hex');
  }
  next();
});

module.exports = mongoose.model('Pet', petSchema);
