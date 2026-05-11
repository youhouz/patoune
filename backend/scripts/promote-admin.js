#!/usr/bin/env node
// Usage local uniquement (jamais exposé via HTTP) :
//   MONGODB_URI=... node backend/scripts/promote-admin.js <email>
// Promeut l'utilisateur en admin. Nécessite l'accès direct à la DB.

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

(async () => {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node promote-admin.js <email>');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI manquant dans .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    console.error(`Utilisateur introuvable: ${email}`);
    process.exit(1);
  }
  user.role = 'admin';
  await user.save();
  console.log(`OK — ${user.name} (${user.email}) est admin.`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
