import express from 'express';
import {
    getConversations,
    getMessages,
    sendMessage,
    createConversation,
    markAsRead,
    editMessage,
    deleteMessage,
    addReaction,
    toggleStarMessage,
    searchMessages,
    toggleMuteConversation,
    toggleArchiveConversation,
    markConversationAsRead,
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';
import { requireOnboarding } from '../middleware/onboardingCheck.js';

const router = express.Router();

// All routes are protected and require onboarding
router.use(protect, requireOnboarding);

// Conversation routes
router.get('/conversations', getConversations);
router.post('/conversation', createConversation);
router.post('/conversations/:conversationId/mute', toggleMuteConversation);
router.post('/conversations/:conversationId/archive', toggleArchiveConversation);

// Message routes
router.get('/:conversationId/messages', getMessages);
router.post('/:conversationId/messages', sendMessage);
router.post('/:conversationId/mark-read', markConversationAsRead);
router.put('/messages/:messageId', editMessage);
router.delete('/messages/:messageId', deleteMessage);
router.put('/:messageId/read', markAsRead);

// Message interactions
router.post('/messages/:messageId/react', addReaction);
router.post('/messages/:messageId/star', toggleStarMessage);

// Search
router.get('/search', searchMessages);

export default router;

