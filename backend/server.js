const express = require('express');
const http = require('http');
const fs = require('fs');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const connectDB = require('./src/config/db');

// Connexion MongoDB
connectDB();

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const server = http.createServer(app);

// CORS : restreindre les origines en production
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : ['*'];
const corsOptions = allowedOrigins.includes('*')
  ? {}
  : { origin: allowedOrigins };

const io = new Server(server, {
  cors: corsOptions
});

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/pets', require('./src/routes/pets'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/petsitters', require('./src/routes/petsitters'));
app.use('/api/bookings', require('./src/routes/bookings'));
app.use('/api/reviews', require('./src/routes/reviews'));
app.use('/api/messages', require('./src/routes/messages'));
app.use('/api/ai', require('./src/routes/ai'));

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'Patoune API v1.0' });
});

// Error handler
app.use(require('./src/middleware/errorHandler'));

// Socket.io pour messagerie temps réel
// Authentification par token JWT avant la connexion
io.use((socket, next) => {
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
      io.to(data.receiver).emit('newMessage', data);
    }
  });

  socket.on('disconnect', () => {
    // Déconnexion silencieuse en production
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur Patoune demarre sur le port ${PORT}`);
});
