const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isControversial: { type: Boolean, default: false },
  risk: { type: String, enum: ['safe', 'moderate', 'dangerous'], default: 'safe' }
}, { _id: false });

const additiveSchema = new mongoose.Schema({
  code: { type: String },
  name: { type: String, required: true },
  risk: { type: String, enum: ['safe', 'moderate', 'dangerous'], default: 'safe' }
}, { _id: false });

const productSchema = new mongoose.Schema({
  barcode: {
    type: String,
    required: [true, 'Le code-barres est requis'],
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Le nom du produit est requis'],
    trim: true
  },
  brand: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    enum: ['alimentation', 'soin', 'hygiene', 'jouet', 'accessoire', 'autre'],
    default: 'alimentation'
  },
  targetAnimal: [{
    type: String,
    enum: ['chien', 'chat', 'rongeur', 'oiseau', 'reptile', 'poisson', 'tous']
  }],
  ingredients: [ingredientSchema],
  additives: [additiveSchema],
  nutritionScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  scoreDetails: {
    protein: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    additivesPenalty: { type: Number, default: 0 },
    qualityBonus: { type: Number, default: 0 }
  },
  image: {
    type: String,
    default: ''
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
