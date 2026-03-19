import Status from '../models/Status.js';
import User from '../models/User.js';
import { getIO } from '../config/socket.js';

// @desc    Update learning status
// @route   POST /api/status
// @access  Private
export const updateStatus = async (req, res, next) => {
    try {
        const { activityText } = req.body;

        // Delete old status
        await Status.deleteMany({ userId: req.user._id });

        // Create new status
        const status = await Status.create({
            userId: req.user._id,
            activityText,
        });

        await status.populate('userId', 'name avatar');

        // Broadcast to connections (simplified - in production, only send to connections)
        try {
            const io = getIO();
            io.emit('status-updated', {
                userId: req.user._id,
                name: req.user.name,
                avatar: req.user.avatar,
                activityText,
                updatedAt: status.createdAt,
            });
        } catch (error) {
            console.error('Socket broadcast error:', error);
        }

        res.status(200).json({
            success: true,
            message: 'Status updated successfully',
            data: {
                status,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get status feed
// @route   GET /api/status/feed
// @access  Private
export const getStatusFeed = async (req, res, next) => {
    try {
        const { limit = 20 } = req.query;

        // Get all active statuses (in production, filter by connections)
        const statuses = await Status.find({
            expiresAt: { $gt: new Date() },
        })
            .populate('userId', 'name avatar')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            count: statuses.length,
            data: {
                statuses,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete status
// @route   DELETE /api/status
// @access  Private
export const deleteStatus = async (req, res, next) => {
    try {
        await Status.deleteMany({ userId: req.user._id });

        res.status(200).json({
            success: true,
            message: 'Status deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};
