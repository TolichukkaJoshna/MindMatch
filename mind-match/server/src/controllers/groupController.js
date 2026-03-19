import Group from '../models/Group.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { trackEvent } from '../services/analyticsService.js';

// @desc    Create new group
// @route   POST /api/groups
// @access  Private
export const createGroup = async (req, res, next) => {
    try {
        const { name, topic, description, isPublic, tags } = req.body;

        // Create conversation for group
        const conversation = await Conversation.create({
            participants: [req.user._id],
            isGroup: true,
            groupName: name,
        });

        // Create group
        const group = await Group.create({
            name,
            topic,
            description,
            creator: req.user._id,
            members: [
                {
                    userId: req.user._id,
                    role: 'admin',
                },
            ],
            isPublic,
            tags,
            conversationId: conversation._id,
        });

        await group.populate('members.userId', 'name email avatar');

        // Track event
        await trackEvent('group_created', req.user._id, { groupId: group._id });

        res.status(201).json({
            success: true,
            message: 'Group created successfully',
            data: {
                group,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get recommended groups
// @route   GET /api/groups/recommended
// @access  Private
export const getRecommendedGroups = async (req, res, next) => {
    try {
        const { limit = 10 } = req.query;

        // Get user's skills to recommend relevant groups
        const userSkills = req.user.skills.map((s) => s.skillName.toLowerCase());

        // Fetch all public groups that the user is not a member of
        const allGroups = await Group.find({
            isPublic: true,
            'members.userId': { $ne: req.user._id },
        })
            .populate('creator', 'name avatar')
            .populate('members.userId', 'name avatar')
            .lean();

        // Score and sort groups by relevance
        const scoredGroups = allGroups.map((group) => {
            let relevanceScore = 0;

            // 1. Skill/topic match (highest priority) - up to 100 points
            const groupTags = group.tags.map((t) => t.toLowerCase());
            const groupTopic = group.topic.toLowerCase();

            // Check for exact tag matches
            const tagMatches = userSkills.filter((skill) => groupTags.includes(skill)).length;
            relevanceScore += tagMatches * 50;

            // Check for topic matches
            const topicMatch = userSkills.some((skill) => groupTopic.includes(skill));
            if (topicMatch) {
                relevanceScore += 30;
            }

            // 2. Activity score (for popular/default groups) - normalized to 0-50 points
            relevanceScore += (group.activityScore || 0) * 0.5;

            // 3. Recency bonus (newer groups get a boost) - up to 20 points
            const daysSinceCreation = (Date.now() - new Date(group.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceCreation < 7) {
                relevanceScore += 20 - (daysSinceCreation * 2.5); // Decreases over 7 days
            }

            return {
                ...group,
                relevanceScore,
            };
        });

        // Sort by relevance score (highest first) and limit results
        const sortedGroups = scoredGroups
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, parseInt(limit))
            .map(({ relevanceScore, ...group }) => group); // Remove score from response

        res.status(200).json({
            success: true,
            count: sortedGroups.length,
            data: {
                groups: sortedGroups,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Join group
// @route   POST /api/groups/:id/join
// @access  Private
export const joinGroup = async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found',
            });
        }

        // Check if already a member
        const isMember = group.members.some(
            (m) => m.userId.toString() === req.user._id.toString()
        );

        if (isMember) {
            return res.status(400).json({
                success: false,
                message: 'Already a member of this group',
            });
        }

        // Add member
        group.members.push({
            userId: req.user._id,
            role: 'member',
        });

        // Update conversation
        await Conversation.findByIdAndUpdate(group.conversationId, {
            $addToSet: { participants: req.user._id },
        });

        await group.save();
        await group.populate('members.userId', 'name email avatar');

        // Track event
        await trackEvent('group_joined', req.user._id, { groupId: group._id });

        res.status(200).json({
            success: true,
            message: 'Joined group successfully',
            data: {
                group,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Leave group
// @route   POST /api/groups/:id/leave
// @access  Private
export const leaveGroup = async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found',
            });
        }

        // Check if creator
        if (group.creator.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Group creator cannot leave. Please delete the group instead.',
            });
        }

        // Remove member
        group.members = group.members.filter(
            (m) => m.userId.toString() !== req.user._id.toString()
        );

        // Update conversation
        await Conversation.findByIdAndUpdate(group.conversationId, {
            $pull: { participants: req.user._id },
        });

        await group.save();

        res.status(200).json({
            success: true,
            message: 'Left group successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's groups
// @route   GET /api/groups/my-groups
// @access  Private
export const getMyGroups = async (req, res, next) => {
    try {
        const groups = await Group.find({
            'members.userId': req.user._id,
        })
            .populate('creator', 'name avatar')
            .populate('members.userId', 'name avatar')
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            count: groups.length,
            data: {
                groups,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get group details
// @route   GET /api/groups/:id
// @access  Private
export const getGroupById = async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate('creator', 'name email avatar')
            .populate('members.userId', 'name email avatar isOnline');

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found',
            });
        }

        res.status(200).json({
            success: true,
            data: {
                group,
            },
        });
    } catch (error) {
        next(error);
    }
};
