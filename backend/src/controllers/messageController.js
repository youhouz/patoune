const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const { sendPushToUser } = require('./notificationController');

// Générer un ID de conversation unique et trié
const getConversationId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('_');
};

// @desc    Envoyer un message
// @route   POST /api/messages
exports.sendMessage = async (req, res, next) => {
  try {
    const { receiver, content } = req.body;

    if (!receiver || !content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Destinataire et contenu requis' });
    }
    if (!mongoose.Types.ObjectId.isValid(receiver)) {
      return res.status(400).json({ success: false, error: 'Identifiant destinataire invalide' });
    }
    if (receiver === req.user.id) {
      return res.status(400).json({ success: false, error: 'Impossible de s\'envoyer un message a soi-meme' });
    }

    // Vérifier que le destinataire existe
    const receiverUser = await User.findById(receiver).select('_id').lean();
    if (!receiverUser) {
      return res.status(404).json({ success: false, error: 'Destinataire introuvable' });
    }

    const conversation = getConversationId(req.user.id, receiver);

    const message = await Message.create({
      conversation,
      sender: req.user.id,
      receiver,
      content: content.trim().slice(0, 1000)
    });

    const populated = await message.populate('sender', 'name avatar');

    // Send push notification to receiver
    const senderUser = await User.findById(req.user.id).select('name').lean();
    sendPushToUser(receiver, {
      title: senderUser?.name || 'Nouveau message',
      body: content.trim().slice(0, 100),
      url: '/messages',
    }).catch(() => {});

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les messages d'une conversation
// @route   GET /api/messages/:userId
exports.getConversation = async (req, res, next) => {
  try {
    const conversation = getConversationId(req.user.id, req.params.userId);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const total = await Message.countDocuments({ conversation });
    const messages = await Message.find({ conversation })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    // Marquer comme lus
    await Message.updateMany(
      { conversation, receiver: req.user.id, read: false },
      { read: true }
    );

    res.json({ success: true, count: messages.length, total, page, messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Liste des conversations
// @route   GET /api/messages/conversations
exports.getConversations = async (req, res, next) => {
  try {
    // Trouver toutes les conversations de l'utilisateur
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { receiver: req.user._id }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversation',
          lastMessage: { $first: '$content' },
          lastDate: { $first: '$createdAt' },
          sender: { $first: '$sender' },
          receiver: { $first: '$receiver' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$receiver', req.user._id] },
                  { $eq: ['$read', false] }
                ]},
                1, 0
              ]
            }
          }
        }
      },
      { $sort: { lastDate: -1 } }
    ]);

    res.json({ success: true, conversations: messages });
  } catch (error) {
    next(error);
  }
};
