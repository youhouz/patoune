const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, uploadAvatar } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile);
router.put('/me/avatar', protect, upload.single('avatar'), uploadAvatar);

module.exports = router;
