import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { trackEvent } from '../services/analyticsService.js';

export const setupChatHandlers = (io, socket) => {

    // Get the actual user ID.
    // Some socket authentication code may store:
    // socket.userId = "64abc..."
    //
    // while other code may store:
    // socket.userId = { userId: "64abc..." }
    //
    // This makes the chat handler work with both formats.
    const getUserId = () => {
        if (
            socket.userId &&
            typeof socket.userId === 'object' &&
            socket.userId.userId
        ) {
            return socket.userId.userId;
        }

        return socket.userId;
    };

    // Join conversation room
    socket.on('join-conversation', async (conversationId) => {
        try {
            const userId = getUserId();

            // Verify user is part of conversation
            const conversation = await Conversation.findOne({
                _id: conversationId,
                participants: userId,
            });

            if (conversation) {
                socket.join(`conversation:${conversationId}`);

                console.log(
                    `User ${userId} joined conversation ${conversationId}`
                );
            }
        } catch (error) {
            console.error('Error joining conversation:', error);
        }
    });

    // Send message
    socket.on('send-message', async (data) => {
        try {
            const userId = getUserId();

            const {
                conversationId,
                text,
                fileUrl,
                fileType,
                messageType,
                codeSnippet,
            } = data;

            // Verify user is part of conversation
            const conversation = await Conversation.findOne({
                _id: conversationId,
                participants: userId,
            });

            if (!conversation) {
                socket.emit('error', {
                    message: 'Conversation not found',
                });
                return;
            }

            // Create message
            const message = await Message.create({
                senderId: userId,
                conversationId,
                text,
                fileUrl,
                fileType,
                messageType: messageType || 'text',
                codeSnippet,
                deliveryStatus: 'sent',
                seenBy: [
                    {
                        userId: userId,
                    },
                ],
            });

            await message.populate('senderId', 'name avatar');

            // Update conversation
            conversation.lastMessage = message._id;
            conversation.updatedAt = new Date();

            // Increment unread count for all participants except sender
            await conversation.incrementUnread(userId);

            // Broadcast to conversation room
            io.to(`conversation:${conversationId}`).emit('new-message', {
                message,
            });

            // Track analytics event
            await trackEvent('message_sent', userId, {
                conversationId,
            });

        } catch (error) {
            console.error('Error sending message:', error);

            socket.emit('error', {
                message: 'Failed to send message',
            });
        }
    });

    // Typing indicator
    socket.on('typing', (data) => {
        try {
            const userId = getUserId();

            const { conversationId, isTyping } = data;

            socket
                .to(`conversation:${conversationId}`)
                .emit('user-typing', {
                    userId,
                    isTyping,
                });
        } catch (error) {
            console.error('Error handling typing event:', error);
        }
    });

    // Mark messages as read
    socket.on('mark-read', async (data) => {
        try {
            const userId = getUserId();

            const { conversationId } = data;

            console.log(
                `[Socket] mark-read event received from user ${userId} for conversation ${conversationId}`
            );

            // Update messages:
            // add user to seenBy and update delivery status
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

            console.log(
                `[Socket] Updated ${updateResult.modifiedCount} messages as read`
            );

            // Reset unread count for this user
            const conversation = await Conversation.findById(
                conversationId
            );

            if (conversation) {
                console.log(
                    `[Socket] Found conversation, resetting unread count...`
                );

                await conversation.resetUnread(userId);

                console.log(
                    `[Socket] Unread count reset complete`
                );
            } else {
                console.log(
                    `[Socket] ERROR: Conversation ${conversationId} not found!`
                );
            }

            // Notify all participants
            io.to(`conversation:${conversationId}`).emit(
                'messages-read',
                {
                    userId,
                    conversationId,
                }
            );

        } catch (error) {
            console.error(
                '[Socket] Error marking messages as read:',
                error
            );
        }
    });

    // Update online status
    socket.on('update-status', async (isOnline) => {
        try {
            const userId = getUserId();

            await User.findByIdAndUpdate(userId, {
                isOnline,
                lastActive: new Date(),
            });

            // Broadcast status update
            io.emit('user-status-changed', {
                userId,
                isOnline,
            });

        } catch (error) {
            console.error(
                'Error updating status:',
                error
            );
        }
    });

    // Handle conversation list refresh request
    socket.on('refresh-conversations', async () => {
        try {
            const userId = getUserId();

            const conversations = await Conversation.find({
                participants: userId,
            })
                .populate(
                    'participants',
                    'name email avatar isOnline lastActive'
                )
                .populate('lastMessage')
                .sort({ updatedAt: -1 });

            socket.emit('conversations-updated', {
                conversations,
            });

        } catch (error) {
            console.error(
                'Error refreshing conversations:',
                error
            );
        }
    });
};