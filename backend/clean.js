/**
 * Patoune - Clean Database
 * Supprime toutes les donnees de seed/demo pour le lancement en production
 * Usage: node clean.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');

const User = require('./src/models/User');
const Pet = require('./src/models/Pet');
const Product = require('./src/models/Product');
const PetSitter = require('./src/models/PetSitter');
const Review = require('./src/models/Review');
const Booking = require('./src/models/Booking');
const ScanHistory = require('./src/models/ScanHistory');
const Message = require('./src/models/Message');

const clean = async () => {
  await connectDB();

  console.log('Suppression de toutes les donnees...');

  const counts = {};
  const models = { User, Pet, Product, PetSitter, Review, Booking, ScanHistory, Message };

  for (const [name, Model] of Object.entries(models)) {
    const count = await Model.countDocuments();
    counts[name] = count;
    if (count > 0) {
      await Model.deleteMany({});
      console.log(`  ${name}: ${count} documents supprimes`);
    } else {
      console.log(`  ${name}: vide`);
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`\nTermine ! ${total} documents supprimes au total.`);
  console.log('La base de donnees est propre pour le lancement.');

  await mongoose.connection.close();
  process.exit(0);
};

clean().catch((err) => {
  console.error('Erreur:', err);
  process.exit(1);
});
