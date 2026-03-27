const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Simple contact message schema
const contactSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
}, { timestamps: true });

const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);

// POST /api/contact - receive a contact message
router.post('/', async (req, res) => {
  try {
    const { subject, name, email, message } = req.body;
    if (!subject || !name || !email || !message) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    await Contact.create({ subject, name, email, message });
    res.json({ success: true, message: 'Message recu' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contact - list all messages (admin only)
const { protect, authorize } = require('../middleware/auth');
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 }).limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
