const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const User = require('../models/User');

// Public: promote a user to admin with secret key
router.get('/promote', async (req, res) => {
  try {
    const { email, secret } = req.query;
    if (!email || !secret) {
      return res.status(400).json({ error: 'email et secret requis' });
    }
    if (secret !== 'pepete-admin-2026') {
      return res.status(403).json({ error: 'Secret invalide' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    user.role = 'admin';
    await user.save();
    res.json({ success: true, message: `${user.name} (${user.email}) est maintenant admin` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', adminController.getDashboardData);
router.get('/users', adminController.getAllUsers);
router.get('/analytics/visitors', adminController.getVisitorAnalytics);
router.get('/analytics/feedbacks', adminController.getFeedbacks);
router.put('/analytics/feedbacks/:id', adminController.updateFeedbackStatus);
router.get('/subscribers', adminController.getSubscribers);

module.exports = router;
