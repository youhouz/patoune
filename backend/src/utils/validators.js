const { body } = require('express-validator');

exports.registerValidation = [
  body('name').notEmpty().withMessage('Le nom est requis').trim(),
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit faire au moins 6 caractères'),
];

exports.loginValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Le mot de passe est requis'),
];

exports.petValidation = [
  body('name').notEmpty().withMessage("Le nom de l'animal est requis"),
  body('species').isIn(['chien', 'chat', 'rongeur', 'oiseau', 'reptile', 'poisson', 'autre'])
    .withMessage('Espèce invalide'),
  body('gender').isIn(['male', 'femelle']).withMessage('Genre invalide'),
];
