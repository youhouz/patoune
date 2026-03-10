const { createAgent } = require('@forestadmin/agent');
const { createMongooseDataSource } = require('@forestadmin/datasource-mongoose');
const mongoose = require('mongoose');

const setupForestAdmin = (app) => {
  if (!process.env.FOREST_AUTH_SECRET || !process.env.FOREST_ENV_SECRET) {
    console.log('⚠️  Forest Admin ignoré : clés manquantes (FOREST_AUTH_SECRET, FOREST_ENV_SECRET).');
    return;
  }

  const agent = createAgent({
    authSecret: process.env.FOREST_AUTH_SECRET,
    envSecret: process.env.FOREST_ENV_SECRET,
    isProduction: process.env.NODE_ENV === 'production',
  });

  agent.addDataSource(createMongooseDataSource(mongoose));
  agent.mountOnExpress(app);
  
  agent.start().then(() => {
    console.log('🌲 Forest Admin démarré avec succès !');
  }).catch((err) => {
    console.error('❌ Erreur lors du lancement de Forest Admin:', err);
  });
};

module.exports = setupForestAdmin;
