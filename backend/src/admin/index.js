const AdminJS = require('adminjs');
const AdminJSExpress = require('@adminjs/express');
const AdminJSMongoose = require('@adminjs/mongoose');
const mongoose = require('mongoose');

// Modèles
const User = require('../models/User');
const Pet = require('../models/Pet');
const PetSitter = require('../models/PetSitter');
const Product = require('../models/Product');
const Booking = require('../models/Booking');

AdminJS.AdminJS.registerAdapter({
  Resource: AdminJSMongoose.Resource,
  Database: AdminJSMongoose.Database,
});

const setupAdmin = (app) => {
  const adminJs = new AdminJS.AdminJS({
    databases: [mongoose],
    rootPath: '/admin',
    branding: {
      companyName: 'Pépète Dashboard',
      logo: false, // on retire le logo par défaut
    }
  });

  const router = AdminJSExpress.buildRouter(adminJs);
  app.use(adminJs.options.rootPath, router);
};

module.exports = setupAdmin;
