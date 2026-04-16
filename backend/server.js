const express = require('express');
const http = require('http');
const fs = require('fs');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const connectDB = require('./src/config/db');

const REQUIRED_ENV_VARS = ['MONGODB_URI', 'JWT_SECRET'];
const missingVars = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);

if (missingVars.length > 0) {
  console.error(`Variables d'environnement manquantes: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Connexion MongoDB
connectDB();

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const server = http.createServer(app);

// Trust proxy pour Vercel / reverse proxy (rate limiter, req.ip)
app.set('trust proxy', 1);

// CORS : origines strictement définies (jamais de wildcard)
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : [
      'http://localhost:8081', 'http://localhost:19006', 'http://localhost:3000',
      'https://pepete.fr', 'https://www.pepete.fr',
      'https://pepete-front.vercel.app',
    ];
const corsOptions = {
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (apps mobiles, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origine non autorisée par CORS'));
    }
  },
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions
});

// Middleware
app.use(helmet());
app.use(cors(corsOptions));

// Stripe webhook — DOIT etre monte avant express.json() avec le body brut
// (sinon la verification de signature echoue).
const { webhook: stripeWebhook } = require('./src/controllers/paymentsController');
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

app.use(express.json({ limit: '5mb' }));

// Forest Admin
const setupForestAdmin = require('./src/admin/forest');
setupForestAdmin(app);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/pets', require('./src/routes/pets'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/petsitters', require('./src/routes/petsitters'));
app.use('/api/bookings', require('./src/routes/bookings'));
app.use('/api/reviews', require('./src/routes/reviews'));
app.use('/api/messages', require('./src/routes/messages'));
app.use('/api/ai', require('./src/routes/ai'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/search', require('./src/routes/search'));
app.use('/api/prelaunch', require('./src/routes/prelaunch'));
app.use('/api/contact', require('./src/routes/contact'));
app.use('/api/payments', require('./src/routes/payments'));
app.use('/api/lost-pets', require('./src/routes/lostPets'));
app.use('/api/professionals', require('./src/routes/professionals'));
app.use('/api/insurance', require('./src/routes/insurance'));

// Landing page pre-launch
app.get('/landing', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'landing', 'index.html'));
});

// OG meta tags for social sharing (rich previews on WhatsApp, Instagram, Facebook)
app.get('/scan/:barcode', async (req, res) => {
  try {
    const Product = require('./src/models/Product');
    const product = await Product.findOne({ barcode: req.params.barcode })
      .select('name brand nutritionScore image barcode')
      .lean();

    if (!product) {
      return res.redirect('https://pepete.fr');
    }

    const score = product.nutritionScore ?? 0;
    const emoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : score >= 40 ? '🟠' : '🔴';
    const verdict = score >= 80 ? 'Excellent' : score >= 60 ? 'Correct' : score >= 40 ? 'Moyen' : 'Deconseille';
    const brandText = product.brand ? ` de ${product.brand}` : '';
    const title = `${emoji} ${product.name}${brandText} — ${score}/100`;
    const description = `Score Pepete : ${verdict}. Scanne les croquettes de ton animal gratuitement sur pepete.fr`;
    const image = product.image || 'https://pepete.fr/og-default.png';
    const url = `https://pepete.fr/scan/${product.barcode}`;

    // Escape HTML
    const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${esc(title)}</title>
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${esc(image)}">
  <meta property="og:url" content="${esc(url)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Pepete">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(image)}">
  <meta name="description" content="${esc(description)}">
  <meta http-equiv="refresh" content="0;url=https://pepete.fr?scan=${esc(product.barcode)}">
</head>
<body>
  <p>Redirection vers Pepete...</p>
  <script>window.location.href="https://pepete.fr?scan=${esc(product.barcode)}";</script>
</body>
</html>`);
  } catch (err) {
    res.redirect('https://pepete.fr');
  }
});

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'Pépète API v1.0' });
});

app.get('/api', (req, res) => {
  res.json({ message: 'Pépète API v1.0' });
});

app.get('/api/health', (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({
    success: dbReady,
    service: 'pepete-api',
    uptime: process.uptime(),
    database: dbReady ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use(require('./src/middleware/errorHandler'));

// Socket.io pour messagerie temps réel
// Authentification par token JWT avant la connexion
io.use((socket, next) => {
  if (!process.env.JWT_SECRET) {
    return next(new Error('Serveur non configure'));
  }

  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Token manquant'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Token invalide'));
  }
});

io.on('connection', (socket) => {
  // Rejoindre automatiquement sa propre room (basée sur l'userId vérifié)
  socket.join(socket.userId);

  socket.on('sendMessage', (data) => {
    if (data.receiver) {
      // Toujours forcer le sender côté serveur (anti-spoofing)
      data.sender = socket.userId;
      io.to(data.receiver).emit('newMessage', data);
    }
  });

  socket.on('disconnect', () => {
    // Déconnexion silencieuse en production
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur Pépète demarre sur le port ${PORT}`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`${signal} recu, arret gracieux...`);
  server.close(() => {
    mongoose.connection.close(false, () => {
      process.exit(0);
    });
  });
  // Force exit après 10s
  setTimeout(() => process.exit(1), 10000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
