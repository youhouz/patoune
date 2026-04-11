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
    // Legacy macros
    protein: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    additivesPenalty: { type: Number, default: 0 },
    qualityBonus: { type: Number, default: 0 },
    ingredientsScore: { type: Number, default: 0 },
    additivesScore: { type: Number, default: 0 },
    nutritionScore: { type: Number, default: 0 },
    // Pro-grade analysis (v3)
    kcalPer100g: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    ingredientTier: { type: Number, default: 0 }, // 1 fresh meat → 4 plant protein
    allergens: [{ type: String }],
    positiveMarkers: [{ type: String }],
    lifeStageWarnings: [{ type: String }],
    marketingTricks: [{ type: String }],
    fediafMet: {
      protein: { type: Boolean, default: true },
      fat: { type: Boolean, default: true },
    },
    dangerousAdditivesCount: { type: Number, default: 0 },
    moderateAdditivesCount: { type: Number, default: 0 },
    benzoateRiskCat: { type: Boolean, default: false },
  },
  description: {
    type: String,
    default: ''
  },
  tips: [{
    type: String
  }],
  targetAge: {
    type: String,
    enum: ['chiot', 'adulte', 'senior', 'chaton', 'tous', ''],
    default: ''
  },
  servingAdvice: {
    type: String,
    default: ''
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
