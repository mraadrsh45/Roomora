const { Message, Conversation } = require('../models/Chat');
const User = require('../models/User');

const setupSocket = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`🔌 User connected: ${userId}`);

    // Mark online
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
    socket.join(`user_${userId}`);
    io.emit('user:online', { userId });

    // Join conversation rooms
    socket.on('join:conversation', (conversationId) => {
      socket.join(`conv_${conversationId}`);
    });

    // Send message
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, type = 'text' } = data;
        const convo = await Conversation.findById(conversationId);
        if (!convo || !convo.isUnlocked) return;
        if (!convo.participants.map(String).includes(userId)) return;

        const message = await Message.create({
          conversation: conversationId,
          sender: userId,
          content,
          type,
          readBy: [userId],
        });
        await message.populate('sender', 'name avatar');

        // Update conversation last message
        convo.lastMessage = message._id;
        await convo.save();

        io.to(`conv_${conversationId}`).emit('message:new', message);

        // Notify the other participant
        const otherId = convo.participants.find((p) => p.toString() !== userId);
        if (otherId) {
          io.to(`user_${otherId}`).emit('notification:new', {
            type: 'message',
            title: 'New message',
            body: content.substring(0, 50),
            data: { conversationId },
          });
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Mark messages as read
    socket.on('message:read', async ({ conversationId }) => {
      try {
        const updated = await Message.updateMany(
          {
            conversation: conversationId,
            readBy: { $ne: userId },
            sender: { $ne: userId },
          },
          { $addToSet: { readBy: userId } }
        );
        if (updated.modifiedCount > 0) {
          // Tell the sender their messages were seen
          io.to(`conv_${conversationId}`).emit('message:seen', {
            conversationId,
            seenBy: userId,
          });
        }
      } catch (err) {
        console.error('message:read error', err.message);
      }
    });

    // Typing indicator
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conv_${conversationId}`).emit('typing:start', { userId });
    });
    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conv_${conversationId}`).emit('typing:stop', { userId });
    });

    socket.on('disconnect', async () => {
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      io.emit('user:offline', { userId });
      console.log(`🔌 User disconnected: ${userId}`);
    });
  });
};

module.exports = setupSocket;
