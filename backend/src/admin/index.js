const AdminJS = require('adminjs');
const AdminJSExpress = require('@adminjs/express');
const AdminJSMongoose = require('@adminjs/mongoose');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
      logo: false,
    }
  });

  // Auth : seuls les admins peuvent accéder au panel
  const router = AdminJSExpress.buildAuthenticatedRouter(adminJs, {
    authenticate: async (email, password) => {
      const user = await User.findOne({ email, role: 'admin' }).select('+password');
      if (!user) return null;
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return null;
      return { email: user.email, id: user._id, title: user.name };
    },
    cookieName: 'pepete-admin',
    cookiePassword: process.env.JWT_SECRET || 'fallback-cookie-secret-change-me',
  });

  app.use(adminJs.options.rootPath, router);
};

module.exports = setupAdmin;
