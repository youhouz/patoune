const mongoose = require('mongoose');

let cachedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  cachedPromise = mongoose.connect(process.env.MONGODB_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  }).then((conn) => {
    console.log(`MongoDB connecté: ${conn.connection.host}`);
    return conn.connection;
  }).catch((error) => {
    cachedPromise = null;
    console.error(`Erreur MongoDB: ${error.message}`);
    throw error;
  });

  return cachedPromise;
};

module.exports = connectDB;
