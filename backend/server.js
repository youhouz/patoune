const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const connectDB = require('./src/config/db');

// Connexion MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
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

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'Patoune API v1.0' });
});

// Error handler
app.use(require('./src/middleware/errorHandler'));

// Socket.io pour messagerie temps réel
io.on('connection', (socket) => {
  console.log('Utilisateur connecté:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
  });

  socket.on('sendMessage', (data) => {
    io.to(data.receiver).emit('newMessage', data);
  });

  socket.on('disconnect', () => {
    console.log('Utilisateur déconnecté:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur Patoune demarre sur le port ${PORT}`);
  console.log(`API accessible sur http://10.0.5.10:${PORT}/api`);
});
