const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../utils/validators');
const rateLimit = require('../middleware/rateLimit');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });

router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.get('/me', protect, getMe);

module.exports = router;
