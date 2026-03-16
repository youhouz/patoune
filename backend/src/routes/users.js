const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, uploadAvatar } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile);
router.put('/me/avatar', protect, uploadAvatar);

module.exports = router;
