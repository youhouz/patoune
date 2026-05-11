#!/usr/bin/env node
// Liste tous les comptes admin de la base.
// Usage : MONGODB_URI=... node backend/scripts/list-admins.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

(async () => {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI manquant dans .env');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const admins = await User.find({ role: 'admin' })
    .select('name email createdAt')
    .lean();
  if (admins.length === 0) {
    console.log('Aucun admin.');
  } else {
    console.log(`${admins.length} admin(s) :`);
    admins.forEach((a) => {
      console.log(`- ${a.email}  ${a.name}  créé ${a.createdAt?.toISOString?.() || '?'}`);
    });
  }
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
