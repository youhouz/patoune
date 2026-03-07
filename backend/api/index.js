const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const connectDB = require('../src/config/db');

const app = express();

// CORS : restreindre les origines en production
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : ['*'];
const corsOptions = allowedOrigins.includes('*')
  ? {}
  : { origin: allowedOrigins };

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// Middleware: connexion DB avant chaque requete
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB Error:', err.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Routes
app.use('/api/auth', require('../src/routes/auth'));
app.use('/api/users', require('../src/routes/users'));
app.use('/api/pets', require('../src/routes/pets'));
app.use('/api/products', require('../src/routes/products'));
app.use('/api/petsitters', require('../src/routes/petsitters'));
app.use('/api/bookings', require('../src/routes/bookings'));
app.use('/api/reviews', require('../src/routes/reviews'));
app.use('/api/messages', require('../src/routes/messages'));
app.use('/api/ai', require('../src/routes/ai'));

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'Patoune API v1.0' });
});
app.get('/api', (req, res) => {
  res.json({ message: 'Patoune API v1.0' });
});

// Error handler
app.use(require('../src/middleware/errorHandler'));

module.exports = app;
