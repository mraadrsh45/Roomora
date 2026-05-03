const { Message, Conversation } = require('../models/Chat');
const User = require('../models/User');
const { Notification } = require('../models/Report');

// POST /api/chat/request — send a chat request
const sendChatRequest = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ message: 'targetUserId is required' });

    const target = await User.findById(targetUserId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const alreadyRequested = target.chatRequests?.find(
      (r) => r.from?.toString() === req.user._id.toString()
    );
    if (alreadyRequested) return res.status(400).json({ message: 'Request already sent' });

    target.chatRequests.push({ from: req.user._id });
    await target.save();

    await Notification.create({
      user: targetUserId,
      type: 'chat-request',
      title: `${req.user.name} wants to chat`,
      body: 'Accept to start messaging',
      data: { fromUserId: req.user._id },
    });

    res.json({ message: 'Chat request sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/chat/accept/:requestId
const acceptChatRequest = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const request = me.chatRequests?.id(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = 'accepted';
    await me.save();

    // Create or unlock conversation
    let convo = await Conversation.findOne({
      participants: { $all: [req.user._id, request.from] },
    });
    if (!convo) {
      convo = await Conversation.create({
        participants: [req.user._id, request.from],
        isUnlocked: true,
        unlockedAt: new Date(),
      });
    } else {
      convo.isUnlocked = true;
      convo.unlockedAt = new Date();
      await convo.save();
    }

    await Notification.create({
      user: request.from,
      type: 'chat-accepted',
      title: `${me.name} accepted your chat request`,
      body: 'You can now message each other',
      data: { conversationId: convo._id },
    });

    res.json({ conversationId: convo._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/chat/conversations
const getConversations = async (req, res) => {
  try {
    const convos = await Conversation.find({
      participants: req.user._id,
      isUnlocked: true,
    })
      .populate('participants', 'name avatar isOnline lastSeen')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    // Attach unread count per conversation
    const enriched = await Promise.all(
      convos.map(async (c) => {
        const unread = await Message.countDocuments({
          conversation: c._id,
          readBy: { $ne: req.user._id },
          sender: { $ne: req.user._id },
        });
        return { ...c.toObject(), unreadCount: unread };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/chat/:conversationId/messages
const getMessages = async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.conversationId);
    if (!convo) return res.status(404).json({ message: 'Conversation not found' });
    if (!convo.participants.map(String).includes(req.user._id.toString()))
      return res.status(403).json({ message: 'Not part of this conversation' });

    const messages = await Message.find({ conversation: convo._id })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    // Mark as read
    await Message.updateMany(
      { conversation: convo._id, readBy: { $ne: req.user._id }, sender: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/chat/requests
const getChatRequests = async (req, res) => {
  try {
    const me = await User.findById(req.user._id)
      .populate('chatRequests.from', 'name avatar profile isVerified location')
      .lean();
    const pending = (me.chatRequests || []).filter((r) => r.status === 'pending');
    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/chat/direct — start or find a direct conversation without request flow
const getOrCreateDirectChat = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ message: 'targetUserId is required' });

    let convo = await Conversation.findOne({
      participants: { $all: [req.user._id, targetUserId] },
    });
    if (!convo) {
      convo = await Conversation.create({
        participants: [req.user._id, targetUserId],
        isUnlocked: true,
        unlockedAt: new Date(),
      });
    }
    res.json({ conversationId: convo._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/chat/:conversationId/read — mark messages as read (REST fallback)
const markConversationRead = async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.conversationId);
    if (!convo) return res.status(404).json({ message: 'Conversation not found' });
    if (!convo.participants.map(String).includes(req.user._id.toString()))
      return res.status(403).json({ message: 'Not part of this conversation' });

    await Message.updateMany(
      {
        conversation: convo._id,
        readBy: { $ne: req.user._id },
        sender: { $ne: req.user._id },
      },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  sendChatRequest,
  acceptChatRequest,
  getConversations,
  getMessages,
  getChatRequests,
  getOrCreateDirectChat,
  markConversationRead,
};
