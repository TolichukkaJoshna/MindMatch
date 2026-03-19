import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { trackEvent } from '../services/analyticsService.js';

export const setupChatHandlers = (io, socket) => {
    // Join conversation room
    socket.on('join-conversation', async (conversationId) => {
        try {
            // Verify user is part of conversation
            const conversation = await Conversation.findOne({
                _id: conversationId,
                participants: socket.userId,
            });

            if (conversation) {
                socket.join(`conversation:${conversationId}`);
                console.log(`User ${socket.userId} joined conversation ${conversationId}`);
            }
        } catch (error) {
            console.error('Error joining conversation:', error);
        }
    });

    // Send message
    socket.on('send-message', async (data) => {
        try {
            const { conversationId, text, fileUrl, fileType, messageType, codeSnippet } = data;

            // Verify user is part of conversation
            const conversation = await Conversation.findOne({
                _id: conversationId,
                participants: socket.userId,
            });

            if (!conversation) {
                socket.emit('error', { message: 'Conversation not found' });
                return;
            }

            // Create message
            const message = await Message.create({
                senderId: socket.userId,
                conversationId,
                text,
                fileUrl,
                fileType,
                messageType: messageType || 'text',
                codeSnippet,
                deliveryStatus: 'sent',
                seenBy: [{ userId: socket.userId }],
            });

            await message.populate('senderId', 'name avatar');

            // Update conversation
            conversation.lastMessage = message._id;
            conversation.updatedAt = new Date();

            // Increment unread count for all participants except sender
            await conversation.incrementUnread(socket.userId);

            // Broadcast to conversation room
            io.to(`conversation:${conversationId}`).emit('new-message', {
                message,
            });

            // Track event
            await trackEvent('message_sent', socket.userId, { conversationId });
        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Typing indicator
    socket.on('typing', (data) => {
        const { conversationId, isTyping } = data;
        socket.to(`conversation:${conversationId}`).emit('user-typing', {
            userId: socket.userId,
            isTyping,
        });
    });

    // Mark messages as read
    socket.on('mark-read', async (data) => {
        try {
            const { conversationId } = data;
            console.log(`[Socket] mark-read event received from user ${socket.userId} for conversation ${conversationId}`);

            // Update messages: add to seenBy and update delivery status
            const updateResult = await Message.updateMany(
                {
                    conversationId,
                    senderId: { $ne: socket.userId },
                    'seenBy.userId': { $ne: socket.userId },
                },
                {
                    $push: {
                        seenBy: {
                            userId: socket.userId,
                            seenAt: new Date(),
                        },
                    },
                    $set: {
                        deliveryStatus: 'delivered',
                    },
                }
            );
            console.log(`[Socket] Updated ${updateResult.modifiedCount} messages as read`);

            // Reset unread count for this user
            const conversation = await Conversation.findById(conversationId);
            if (conversation) {
                console.log(`[Socket] Found conversation, resetting unread count...`);
                await conversation.resetUnread(socket.userId);
                console.log(`[Socket] Unread count reset complete`);
            } else {
                console.log(`[Socket] ERROR: Conversation ${conversationId} not found!`);
            }

            // Notify ALL participants (including the user who marked as read)
            // This ensures the conversation list updates for everyone
            console.log(`[Socket] Emitting messages-read event to conversation room`);
            io.to(`conversation:${conversationId}`).emit('messages-read', {
                userId: socket.userId,
                conversationId,
            });
        } catch (error) {
            console.error('[Socket] Error marking messages as read:', error);
        }
    });

    // Update online status
    socket.on('update-status', async (isOnline) => {
        try {
            await User.findByIdAndUpdate(socket.userId, {
                isOnline,
                lastActive: new Date(),
            });

            // Broadcast status update
            io.emit('user-status-changed', {
                userId: socket.userId,
                isOnline,
            });
        } catch (error) {
            console.error('Error updating status:', error);
        }
    });

    // Handle conversation list refresh request
    socket.on('refresh-conversations', async () => {
        try {
            const conversations = await Conversation.find({
                participants: socket.userId,
            })
                .populate('participants', 'name email avatar isOnline lastActive')
                .populate('lastMessage')
                .sort({ updatedAt: -1 });

            socket.emit('conversations-updated', { conversations });
        } catch (error) {
            console.error('Error refreshing conversations:', error);
        }
    });
};
