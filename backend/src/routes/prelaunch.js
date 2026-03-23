const express = require('express');
const router = express.Router();
const PreLaunchSubscriber = require('../models/PreLaunchSubscriber');

// POST /api/prelaunch/subscribe
router.post('/subscribe', async (req, res) => {
  try {
    const { email, userType, name, city } = req.body;

    if (!email || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Email et type d\'utilisateur requis',
      });
    }

    const existing = await PreLaunchSubscriber.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Cet email est deja inscrit !',
      });
    }

    const subscriber = await PreLaunchSubscriber.create({
      email,
      userType,
      name: name || '',
      city: city || '',
      source: 'landing',
    });

    const totalCount = await PreLaunchSubscriber.countDocuments();

    res.status(201).json({
      success: true,
      message: 'Inscription reussie ! Vous serez informe en avant-premiere.',
      totalSubscribers: totalCount,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Cet email est deja inscrit !',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur serveur, reessayez plus tard',
    });
  }
});

// GET /api/prelaunch/count
router.get('/count', async (req, res) => {
  try {
    const total = await PreLaunchSubscriber.countDocuments();
    const byType = await PreLaunchSubscriber.aggregate([
      { $group: { _id: '$userType', count: { $sum: 1 } } },
    ]);
    res.json({ success: true, total, byType });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
