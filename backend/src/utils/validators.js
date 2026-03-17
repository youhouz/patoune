const { body } = require('express-validator');

exports.registerValidation = [
  body('name')
    .notEmpty().withMessage('Le nom est requis')
    .trim()
    .isLength({ max: 50 }).withMessage('Le nom ne peut pas dépasser 50 caractères')
    .escape(),
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit faire au moins 8 caractères'),
  body('role')
    .optional()
    .isIn(['user', 'guardian', 'both']).withMessage('Rôle invalide'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Numéro de téléphone trop long'),
];

exports.loginValidation = [
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password').notEmpty().withMessage('Le mot de passe est requis'),
];

exports.petValidation = [
  body('name').notEmpty().withMessage("Le nom de l'animal est requis"),
  body('species').isIn(['chien', 'chat', 'rongeur', 'oiseau', 'reptile', 'poisson', 'autre'])
    .withMessage('Espèce invalide'),
  body('gender').isIn(['male', 'femelle']).withMessage('Genre invalide'),
];
