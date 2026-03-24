const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

// POST /api/feedback — anyone can submit (no auth required)
router.post('/', async (req, res, next) => {
  try {
    const { category, title, description, screenshots, platform, user } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, error: 'La description est requise' });
    }

    const feedback = await Feedback.create({
      user: user || 'anonyme',
      category: category || 'bug',
      title: title || '',
      description: description.trim(),
      screenshots: (screenshots || []).slice(0, 3), // max 3
      platform: platform || 'unknown',
    });

    res.status(201).json({ success: true, data: { id: feedback._id } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
