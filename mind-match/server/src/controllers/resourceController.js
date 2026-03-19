import Resource from '../models/Resource.js';
import { trackEvent } from '../services/analyticsService.js';

// @desc    Post new resource
// @route   POST /api/resources
// @access  Private
export const postResource = async (req, res, next) => {
    try {
        const { title, link, description, tags } = req.body;

        const resource = await Resource.create({
            title,
            link,
            description,
            tags,
            postedBy: req.user._id,
        });

        await resource.populate('postedBy', 'name avatar');

        // Track event
        await trackEvent('resource_posted', req.user._id, { resourceId: resource._id });

        res.status(201).json({
            success: true,
            message: 'Resource posted successfully',
            data: {
                resource,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get resources
// @route   GET /api/resources
// @access  Private
export const getResources = async (req, res, next) => {
    try {
        const { tags, search, limit = 20, sort = '-createdAt' } = req.query;

        const query = {};

        if (tags) {
            const tagArray = tags.split(',');
            query.tags = { $in: tagArray };
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const resources = await Resource.find(query)
            .populate('postedBy', 'name avatar')
            .sort(sort)
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            count: resources.length,
            data: {
                resources,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get top resources
// @route   GET /api/resources/top
// @access  Private
export const getTopResources = async (req, res, next) => {
    try {
        const { limit = 10 } = req.query;

        const resources = await Resource.find()
            .populate('postedBy', 'name avatar')
            .sort({ upvotes: -1 })
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            count: resources.length,
            data: {
                resources,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Upvote resource
// @route   POST /api/resources/:id/upvote
// @access  Private
export const upvoteResource = async (req, res, next) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found',
            });
        }

        // Check if already upvoted
        const alreadyUpvoted = resource.upvotedBy.includes(req.user._id);
        const alreadyDownvoted = resource.downvotedBy.includes(req.user._id);

        if (alreadyUpvoted) {
            // Remove upvote
            resource.upvotedBy = resource.upvotedBy.filter(
                (id) => id.toString() !== req.user._id.toString()
            );
            resource.upvotes -= 1;
        } else {
            // Add upvote
            resource.upvotedBy.push(req.user._id);
            resource.upvotes += 1;

            // Remove downvote if exists
            if (alreadyDownvoted) {
                resource.downvotedBy = resource.downvotedBy.filter(
                    (id) => id.toString() !== req.user._id.toString()
                );
                resource.downvotes -= 1;
            }

            // Track event
            await trackEvent('resource_upvoted', req.user._id, {
                resourceId: resource._id,
            });
        }

        await resource.save();

        res.status(200).json({
            success: true,
            message: alreadyUpvoted ? 'Upvote removed' : 'Resource upvoted',
            data: {
                upvotes: resource.upvotes,
                downvotes: resource.downvotes,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Downvote resource
// @route   POST /api/resources/:id/downvote
// @access  Private
export const downvoteResource = async (req, res, next) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found',
            });
        }

        // Check if already downvoted
        const alreadyDownvoted = resource.downvotedBy.includes(req.user._id);
        const alreadyUpvoted = resource.upvotedBy.includes(req.user._id);

        if (alreadyDownvoted) {
            // Remove downvote
            resource.downvotedBy = resource.downvotedBy.filter(
                (id) => id.toString() !== req.user._id.toString()
            );
            resource.downvotes -= 1;
        } else {
            // Add downvote
            resource.downvotedBy.push(req.user._id);
            resource.downvotes += 1;

            // Remove upvote if exists
            if (alreadyUpvoted) {
                resource.upvotedBy = resource.upvotedBy.filter(
                    (id) => id.toString() !== req.user._id.toString()
                );
                resource.upvotes -= 1;
            }
        }

        await resource.save();

        res.status(200).json({
            success: true,
            message: alreadyDownvoted ? 'Downvote removed' : 'Resource downvoted',
            data: {
                upvotes: resource.upvotes,
                downvotes: resource.downvotes,
            },
        });
    } catch (error) {
        next(error);
    }
};
