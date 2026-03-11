const { createAgent } = require('@forestadmin/agent');
const { createMongooseDataSource } = require('@forestadmin/datasource-mongoose');
const mongoose = require('mongoose');

let agent = null;

const setupForestAdmin = (app) => {
  if (!process.env.FOREST_AUTH_SECRET || !process.env.FOREST_ENV_SECRET) {
    console.log('⚠️ Forest Admin ignoré : clés manquantes.');
    return null;
  }

  if (agent) return agent;

  // Pre-load modèles
  require('../models/User');
  require('../models/Pet');
  require('../models/PetSitter');
  require('../models/Product');
  require('../models/Booking');

  agent = createAgent({
    authSecret: process.env.FOREST_AUTH_SECRET,
    envSecret: process.env.FOREST_ENV_SECRET,
    isProduction: process.env.NODE_ENV === 'production',
  });

  agent.addDataSource(createMongooseDataSource(mongoose));
  agent.mountOnExpress(app);
  
  return agent;
};

module.exports = setupForestAdmin;
