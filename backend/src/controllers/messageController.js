const Message = require('../models/Message');

// Générer un ID de conversation unique et trié
const getConversationId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('_');
};

// @desc    Envoyer un message
// @route   POST /api/messages
exports.sendMessage = async (req, res, next) => {
  try {
    const { receiver, content } = req.body;
    const conversation = getConversationId(req.user.id, receiver);

    const message = await Message.create({
      conversation,
      sender: req.user.id,
      receiver,
      content
    });

    const populated = await message.populate('sender', 'name avatar');

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

    const messages = await Message.find({ conversation })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    // Marquer comme lus
    await Message.updateMany(
      { conversation, receiver: req.user.id, read: false },
      { read: true }
    );

    res.json({ success: true, count: messages.length, messages });
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
