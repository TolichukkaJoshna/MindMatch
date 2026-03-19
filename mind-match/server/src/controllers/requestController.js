import StudyRequest from '../models/StudyRequest.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import { trackEvent } from '../services/analyticsService.js';
import { getIO } from '../config/socket.js';

// @desc    Send study request
// @route   POST /api/requests/send
// @access  Private
export const sendRequest = async (req, res, next) => {
    try {
        const { toUser, message } = req.body;

        // Check if recipient exists
        const recipient = await User.findById(toUser);
        if (!recipient) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Check if request already exists FROM current user TO target user
        const existingOutgoingRequest = await StudyRequest.findOne({
            fromUser: req.user._id,
            toUser,
            status: 'pending',
        });

        if (existingOutgoingRequest) {
            return res.status(400).json({
                success: false,
                message: 'Request already sent to this user',
            });
        }

        // Check if request already exists FROM target user TO current user
        const existingIncomingRequest = await StudyRequest.findOne({
            fromUser: toUser,
            toUser: req.user._id,
            status: 'pending',
        });

        if (existingIncomingRequest) {
            return res.status(400).json({
                success: false,
                message: 'This user has already sent you a request. Please check your received requests.',
            });
        }

        // Create request
        const request = await StudyRequest.create({
            fromUser: req.user._id,
            toUser,
            message,
        });

        await request.populate('fromUser', 'name email avatar skills');

        // Send real-time notification
        try {
            const io = getIO();
            io.to(`user:${toUser}`).emit('new-request', {
                request: {
                    _id: request._id,
                    from: request.fromUser,
                    message: request.message,
                    createdAt: request.createdAt,
                },
            });
        } catch (error) {
            console.error('Socket notification error:', error);
        }

        // Track event
        await trackEvent('request_sent', req.user._id, { toUser });

        res.status(201).json({
            success: true,
            message: 'Study request sent successfully',
            data: {
                request,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get received requests
// @route   GET /api/requests/received
// @access  Private
export const getReceivedRequests = async (req, res, next) => {
    try {
        const { status = 'pending' } = req.query;

        const query = { toUser: req.user._id };
        if (status) {
            query.status = status;
        }

        const requests = await StudyRequest.find(query)
            .populate('fromUser', 'name email avatar skills goals location')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: requests.length,
            data: {
                requests,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get sent requests
// @route   GET /api/requests/sent
// @access  Private
export const getSentRequests = async (req, res, next) => {
    try {
        const { status } = req.query;

        const query = { fromUser: req.user._id };
        if (status) {
            query.status = status;
        }

        const requests = await StudyRequest.find(query)
            .populate('toUser', 'name email avatar skills goals location')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: requests.length,
            data: {
                requests,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Accept study request
// @route   PUT /api/requests/:id/accept
// @access  Private
export const acceptRequest = async (req, res, next) => {
    try {
        const request = await StudyRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found',
            });
        }

        // Check if user is the recipient
        if (request.toUser.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Request already processed',
            });
        }

        request.status = 'accepted';
        await request.save();

        // Check/Create Conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [request.fromUser, request.toUser] },
            isGroup: false
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [request.fromUser, request.toUser],
                isGroup: false,
                conversationType: 'direct'
            });
        }

        // Populate conversation participants
        await conversation.populate('participants', 'name email avatar skills isOnline lastActive');

        // Send real-time notification
        try {
            const io = getIO();
            // Notify the sender that their request was accepted
            io.to(`user:${request.fromUser}`).emit('request-accepted', {
                requestId: request._id,
                acceptedBy: req.user.name,
                conversationId: conversation._id,
            });

            // Notify both users about the new conversation
            io.to(`user:${request.fromUser}`).emit('conversation-created', {
                conversation,
            });
            io.to(`user:${request.toUser}`).emit('conversation-created', {
                conversation,
            });
        } catch (error) {
            console.error('Socket notification error:', error);
        }

        // Track event
        await trackEvent('request_accepted', req.user._id, {
            requestId: request._id,
        });

        res.status(200).json({
            success: true,
            message: 'Request accepted',
            data: {
                request,
                conversation: {
                    _id: conversation._id,
                    participants: conversation.participants,
                    conversationType: conversation.conversationType,
                    isGroup: conversation.isGroup,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reject study request
// @route   PUT /api/requests/:id/reject
// @access  Private
export const rejectRequest = async (req, res, next) => {
    try {
        const request = await StudyRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found',
            });
        }

        // Check if user is the recipient
        if (request.toUser.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Request already processed',
            });
        }

        request.status = 'rejected';
        await request.save();

        res.status(200).json({
            success: true,
            message: 'Request rejected',
            data: {
                request,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel study request
// @route   DELETE /api/requests/:id/cancel
// @access  Private
export const cancelRequest = async (req, res, next) => {
    try {
        const request = await StudyRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found',
            });
        }

        // Check if user is the sender
        if (request.fromUser.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel processed request',
            });
        }

        await request.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Request cancelled',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get connection status with a user
// @route   GET /api/requests/status/:userId
// @access  Private
export const getConnectionStatus = async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Check if there's an existing conversation (already connected)
        const conversation = await Conversation.findOne({
            participants: { $all: [req.user._id, userId] },
            isGroup: false
        });

        if (conversation) {
            return res.status(200).json({
                success: true,
                data: {
                    status: 'connected',
                    conversationId: conversation._id,
                },
            });
        }

        // Check for pending request sent by current user
        const sentRequest = await StudyRequest.findOne({
            fromUser: req.user._id,
            toUser: userId,
            status: 'pending',
        });

        if (sentRequest) {
            return res.status(200).json({
                success: true,
                data: {
                    status: 'pending-sent',
                    requestId: sentRequest._id,
                },
            });
        }

        // Check for pending request received from target user
        const receivedRequest = await StudyRequest.findOne({
            fromUser: userId,
            toUser: req.user._id,
            status: 'pending',
        });

        if (receivedRequest) {
            return res.status(200).json({
                success: true,
                data: {
                    status: 'pending-received',
                    requestId: receivedRequest._id,
                },
            });
        }

        // No connection or pending requests
        res.status(200).json({
            success: true,
            data: {
                status: 'none',
            },
        });
    } catch (error) {
        next(error);
    }
};
