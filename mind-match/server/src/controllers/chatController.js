import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { trackEvent } from '../services/analyticsService.js';

// @desc    Get all conversations for user
// @route   GET /api/chat/conversations
// @access  Private
export const getConversations = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { includeArchived = false } = req.query;

        const query = {
            participants: userId,
        };

        if (!includeArchived) {
            query.archivedBy = { $ne: userId };
        }

        const conversations = await Conversation.find(query)
            .populate('participants', 'name email avatar isOnline lastActive')
            .populate('lastMessage')
            .sort({ updatedAt: -1 });

        // Add unread count and muted status for each conversation
        const conversationsWithMeta = conversations.map(conv => {
            const unreadCount = conv.unreadCount?.get(userId.toString()) || 0;
            const isMuted = conv.mutedBy?.some(m => m.userId.toString() === userId.toString()) || false;

            const convName = conv.groupName || conv.participants?.find(p => p._id.toString() !== userId.toString())?.name || 'Unknown';
            console.log(`[getConversations] ${convName}: unreadCount=${unreadCount}, unreadMap=`, conv.unreadCount);

            return {
                ...conv.toObject(),
                unreadCount,
                isMuted,
            };
        });

        console.log(`[getConversations] Returning ${conversationsWithMeta.length} conversations for user ${userId}`);

        res.status(200).json({
            success: true,
            count: conversationsWithMeta.length,
            data: {
                conversations: conversationsWithMeta,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/:conversationId/messages
// @access  Private
export const getMessages = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const { limit = 50, before } = req.query;

        // Check if user is part of conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.user._id,
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found',
            });
        }

        const query = {
            conversationId,
            isDeleted: false, // Don't show deleted messages
        };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('senderId', 'name avatar')
            .populate('replyTo'); // Populate replied message

        res.status(200).json({
            success: true,
            count: messages.length,
            data: {
                messages: messages.reverse(),
                hasMore: messages.length === parseInt(limit),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create or get conversation
// @route   POST /api/chat/conversation
// @access  Private
export const createConversation = async (req, res, next) => {
    try {
        const { participantId } = req.body;

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            participants: { $all: [req.user._id, participantId] },
            isGroup: false,
        }).populate('participants', 'name email avatar isOnline lastActive');

        if (conversation) {
            return res.status(200).json({
                success: true,
                data: {
                    conversation,
                },
            });
        }

        // Create new conversation
        conversation = await Conversation.create({
            participants: [req.user._id, participantId],
            isGroup: false,
        });

        await conversation.populate('participants', 'name email avatar isOnline lastActive');

        res.status(201).json({
            success: true,
            message: 'Conversation created',
            data: {
                conversation,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Send a message
// @route   POST /api/chat/:conversationId/messages
// @access  Private
export const sendMessage = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const { text, messageType = 'text', fileUrl, fileType, fileName, codeSnippet } = req.body;
        const senderId = req.user._id;

        // Verify conversation exists and user is participant
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: senderId,
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found or you are not a participant',
            });
        }

        // Create message
        const message = await Message.create({
            conversationId,
            senderId,
            text,
            messageType,
            fileUrl,
            fileType,
            fileName,
            codeSnippet,
            deliveryStatus: 'sent',
            seenBy: [{ userId: senderId }], // Sender has seen their own message
        });

        // Populate sender info
        await message.populate('senderId', 'name avatar email');

        // Update conversation's lastMessage and updatedAt
        conversation.lastMessage = message._id;
        conversation.updatedAt = new Date();

        // Increment unread count for all participants except sender
        await conversation.incrementUnread(senderId);

        // Emit socket event to all participants
        const io = req.app.get('io');
        if (io) {
            conversation.participants.forEach(participantId => {
                io.to(`user:${participantId}`).emit('new-message', {
                    message: message.toObject(),
                    conversationId,
                });
            });
        }

        // Track analytics
        trackEvent('message_sent', {
            userId: senderId,
            conversationId,
            messageType,
        });

        res.status(201).json({
            success: true,
            message: 'Message sent',
            data: {
                message,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark message as read
// @route   PUT /api/chat/:messageId/read
// @access  Private
export const markAsRead = async (req, res, next) => {
    try {
        const message = await Message.findById(req.params.messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found',
            });
        }

        // Check if already seen
        const alreadySeen = message.seenBy.some(
            (seen) => seen.userId.toString() === req.user._id.toString()
        );

        if (!alreadySeen) {
            message.seenBy.push({
                userId: req.user._id,
                seenAt: new Date(),
            });
            await message.save();
        }

        res.status(200).json({
            success: true,
            message: 'Message marked as read',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Edit message
// @route   PUT /api/chat/messages/:messageId
// @access  Private
export const editMessage = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { messageId } = req.params;
        const { text } = req.body;

        const message = await Message.findOne({
            _id: messageId,
            senderId: userId,
            isDeleted: false,
        });

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found or you do not have permission to edit',
            });
        }

        // Check if message is too old to edit (15 minutes)
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        if (message.createdAt < fifteenMinutesAgo) {
            return res.status(400).json({
                success: false,
                message: 'Message is too old to edit',
            });
        }

        await message.editMessage(text);

        res.status(200).json({
            success: true,
            data: { message },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete message
// @route   DELETE /api/chat/messages/:messageId
// @access  Private
export const deleteMessage = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { messageId } = req.params;

        const message = await Message.findOne({
            _id: messageId,
            senderId: userId,
        });

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found or you do not have permission to delete',
            });
        }

        message.isDeleted = true;
        message.deletedAt = new Date();
        message.deletedBy = userId;
        await message.save();

        res.status(200).json({
            success: true,
            message: 'Message deleted',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add reaction to message
// @route   POST /api/chat/messages/:messageId/react
// @access  Private
export const addReaction = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { messageId } = req.params;
        const { emoji } = req.body;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found',
            });
        }

        await message.addReaction(userId, emoji);

        res.status(200).json({
            success: true,
            data: { reactions: message.reactions },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Star/unstar message
// @route   POST /api/chat/messages/:messageId/star
// @access  Private
export const toggleStarMessage = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { messageId } = req.params;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found',
            });
        }

        const isStarred = message.starredBy.includes(userId);

        if (isStarred) {
            message.starredBy = message.starredBy.filter(id => id.toString() !== userId.toString());
        } else {
            message.starredBy.push(userId);
        }

        await message.save();

        res.status(200).json({
            success: true,
            data: { isStarred: !isStarred },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Search messages
// @route   GET /api/chat/search
// @access  Private
export const searchMessages = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { query, conversationId } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a search query',
            });
        }

        // Get user's conversations
        const conversations = await Conversation.find({
            participants: userId,
        }).select('_id');

        const conversationIds = conversations.map(c => c._id);

        // Build search query
        const searchQuery = {
            conversationId: conversationId || { $in: conversationIds },
            isDeleted: false,
            text: { $regex: query, $options: 'i' },
        };

        const messages = await Message.find(searchQuery)
            .populate('senderId', 'name avatar')
            .populate('conversationId', 'participants groupName')
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            data: { messages },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mute/unmute conversation
// @route   POST /api/chat/conversations/:conversationId/mute
// @access  Private
export const toggleMuteConversation = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { conversationId } = req.params;
        const { mutedUntil } = req.body;

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId,
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found',
            });
        }

        const isMuted = conversation.mutedBy?.some(m => m.userId.toString() === userId.toString()) || false;

        if (isMuted) {
            // Unmute
            conversation.mutedBy = conversation.mutedBy.filter(
                m => m.userId.toString() !== userId.toString()
            );
        } else {
            // Mute
            if (!conversation.mutedBy) conversation.mutedBy = [];
            conversation.mutedBy.push({
                userId,
                mutedUntil: mutedUntil ? new Date(mutedUntil) : null,
            });
        }

        await conversation.save();

        res.status(200).json({
            success: true,
            data: { isMuted: !isMuted },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Archive/unarchive conversation
// @route   POST /api/chat/conversations/:conversationId/archive
// @access  Private
export const toggleArchiveConversation = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { conversationId } = req.params;

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId,
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found',
            });
        }

        const isArchived = conversation.archivedBy?.includes(userId) || false;

        if (isArchived) {
            conversation.archivedBy = conversation.archivedBy.filter(
                id => id.toString() !== userId.toString()
            );
        } else {
            if (!conversation.archivedBy) conversation.archivedBy = [];
            conversation.archivedBy.push(userId);
        }

        await conversation.save();

        res.status(200).json({
            success: true,
            data: { isArchived: !isArchived },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark all messages in conversation as read
// @route   POST /api/chat/:conversationId/mark-read
// @access  Private
export const markConversationAsRead = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        console.log(`[markConversationAsRead] User ${userId} marking conversation ${conversationId} as read`);

        // Verify conversation exists and user is participant
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId,
        });

        if (!conversation) {
            console.log(`[markConversationAsRead] Conversation not found or user not participant`);
            return res.status(404).json({
                success: false,
                message: 'Conversation not found or you are not a participant',
            });
        }

        // Update all messages that the user hasn't seen yet
        const updateResult = await Message.updateMany(
            {
                conversationId,
                senderId: { $ne: userId },
                'seenBy.userId': { $ne: userId },
            },
            {
                $push: {
                    seenBy: {
                        userId: userId,
                        seenAt: new Date(),
                    },
                },
                $set: {
                    deliveryStatus: 'delivered',
                },
            }
        );

        console.log(`[markConversationAsRead] Updated ${updateResult.modifiedCount} messages`);

        // Reset unread count for this user
        await conversation.resetUnread(userId);

        console.log(`[markConversationAsRead] Reset unread count for user ${userId}`);

        // Emit socket event to notify all participants
        const io = req.app.get('io');
        if (io) {
            io.to(`conversation:${conversationId}`).emit('messages-read', {
                userId: userId.toString(),
                conversationId: conversationId.toString(),
            });
            console.log(`[markConversationAsRead] Emitted messages-read event`);
        }

        // Return success with updated unread count
        res.status(200).json({
            success: true,
            data: {
                conversationId,
                unreadCount: 0,
                messagesUpdated: updateResult.modifiedCount,
            },
        });
    } catch (error) {
        console.error('[markConversationAsRead] Error:', error);
        next(error);
    }
};
