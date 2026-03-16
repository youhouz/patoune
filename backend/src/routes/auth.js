const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../utils/validators');
const rateLimit = require('../middleware/rateLimit');
const User = require('../models/User');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });

router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.get('/me', protect, getMe);

// Endpoint temporaire pour créer des comptes de test
router.post('/seed-test', async (req, res) => {
  try {
    const testUsers = [
      { name: 'Test Owner', email: 'owner@test.com', password: 'test123', role: 'user', phone: '0600000001' },
      { name: 'Test Sitter', email: 'sitter@test.com', password: 'test123', role: 'guardian', phone: '0600000002', isPetSitter: true },
      { name: 'Test Both', email: 'both@test.com', password: 'test123', role: 'both', phone: '0600000003', isPetSitter: true },
    ];

    const results = [];
    for (const u of testUsers) {
      const exists = await User.findOne({ email: u.email });
      if (exists) {
        results.push({ email: u.email, status: 'already exists' });
      } else {
        const user = await User.create(u);
        results.push({ email: u.email, status: 'created', id: user._id, role: user.role });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('[SEED] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint de debug pour tester le register sans rate limit
router.post('/debug-register', async (req, res) => {
  try {
    console.log('[DEBUG-REGISTER] Headers:', JSON.stringify(req.headers['content-type']));
    console.log('[DEBUG-REGISTER] Body type:', typeof req.body);
    console.log('[DEBUG-REGISTER] Body:', JSON.stringify(req.body));
    console.log('[DEBUG-REGISTER] Body keys:', Object.keys(req.body || {}));
    res.json({
      success: true,
      received: {
        bodyType: typeof req.body,
        bodyKeys: Object.keys(req.body || {}),
        hasName: !!req.body?.name,
        hasEmail: !!req.body?.email,
        hasPassword: !!req.body?.password,
        role: req.body?.role,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
