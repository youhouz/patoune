const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const connectDB = require('../src/config/db');
const setupForestAdmin = require('../src/admin/forest');

const app = express();

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : ['*'];
const corsOptions = allowedOrigins.includes('*') ? {} : { origin: allowedOrigins };

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// Middleware interne (Express handle)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.get('/api/health', (req, res) => res.json({ success: true, service: 'pepete-api', status: 'ok' }));

// Forest Admin Initialisation (Mount)
const agent = setupForestAdmin(app);

// Routes
app.use('/api/auth', require('../src/routes/auth'));
app.use('/api/users', require('../src/routes/users'));
app.use('/api/admin', require('../src/routes/admin'));
app.use('/api/pets', require('../src/routes/pets'));
app.use('/api/products', require('../src/routes/products'));
app.use('/api/petsitters', require('../src/routes/petsitters'));
app.use('/api/bookings', require('../src/routes/bookings'));
app.use('/api/reviews', require('../src/routes/reviews'));
app.use('/api/messages', require('../src/routes/messages'));
app.use('/api/ai', require('../src/routes/ai'));

app.use(require('../src/middleware/errorHandler'));

// Vercel Serverless Entry Point
let isForestStarted = false;

module.exports = async (req, res) => {
  // Toujours s'assurer d'être connecté à la bdd avant de lancer l'agent Forest
  await connectDB();
  
  if (agent && !isForestStarted) {
    try {
      console.log('Démarrage de Forest Admin...');
      await agent.start();
      isForestStarted = true;
      console.log('Forest Admin démarré avec succès');
    } catch (e) {
      console.error('Erreur Forest:', e);
    }
  }

  // Passer la requête à l'application web Express
  return app(req, res);
};
