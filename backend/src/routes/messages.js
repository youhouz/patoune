const express = require('express');
const router = express.Router();
const { sendMessage, getConversation, getConversations } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

router.get('/conversations', protect, getConversations);
router.post('/', protect, sendMessage);
router.get('/:userId', protect, validateObjectId('userId'), getConversation);

module.exports = router;
