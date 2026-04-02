const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const User = require('../models/User');

// Public: create admin account with secret key
router.get('/setup', async (req, res) => {
  try {
    const { secret } = req.query;
    if (secret !== 'pepete-admin-2026') {
      return res.status(403).json({ error: 'Secret invalide' });
    }
    const adminEmail = 'admin@pepete.fr';
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      existing.role = 'admin';
      await existing.save();
      return res.json({ success: true, message: 'Compte admin existe déjà, rôle mis à jour', email: adminEmail });
    }
    const user = await User.create({
      name: 'Admin Pepete',
      email: adminEmail,
      password: 'Pepete2026!',
      role: 'admin',
    });
    res.json({
      success: true,
      message: 'Compte admin créé',
      email: adminEmail,
      password: 'Pepete2026!',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// Pet-sitter management
router.get('/petsitters', adminController.getAllPetSitters);
router.put('/petsitters/:id', adminController.updatePetSitter);
router.delete('/petsitters/:id', adminController.deletePetSitter);

module.exports = router;
