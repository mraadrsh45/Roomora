const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendChatRequest,
  acceptChatRequest,
  getConversations,
  getMessages,
  getChatRequests,
  getOrCreateDirectChat,
  markConversationRead,
} = require('../controllers/chatController');

router.post('/request', protect, sendChatRequest);
router.post('/direct', protect, getOrCreateDirectChat);
router.put('/accept/:requestId', protect, acceptChatRequest);
router.get('/conversations', protect, getConversations);
router.get('/requests', protect, getChatRequests);
router.get('/:conversationId/messages', protect, getMessages);
router.put('/:conversationId/read', protect, markConversationRead);

module.exports = router;
