import User from '../models/User.js';
import Skill from '../models/Skill.js';
import { findMatchesForUser } from '../services/matchingEngine.js';
import Match from '../models/Match.js';
import { cacheDel } from '../config/redis.js';
import multer from 'multer';
import path from 'path';

// Configure multer for avatar upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
});

export const uploadAvatar = upload.single('avatar');

// @desc    Update user skills (onboarding step 1)
// @route   PUT /api/users/onboarding/skills
// @access  Private
export const updateSkills = async (req, res, next) => {
    try {
        const { skills } = req.body;

        // Validate and process skills
        const processedSkills = await Promise.all(
            skills.map(async (skill) => {
                // Escape special regex characters in skill name
                const escapedSkillName = skill.skillName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                // Find or create skill
                let skillDoc = await Skill.findOne({
                    name: { $regex: new RegExp(`^${escapedSkillName}$`, 'i') },
                });

                if (!skillDoc) {
                    skillDoc = await Skill.create({
                        name: skill.skillName,
                        category: 'other',
                    });
                }

                return {
                    skillId: skillDoc._id,
                    skillName: skillDoc.name,
                    level: skill.level,
                };
            })
        );

        req.user.skills = processedSkills;
        await req.user.save();

        // Invalidate cache for users who have this user in their matches
        const matchedUsers = await Match.find({ matchedUserId: req.user._id }).distinct('userId');
        for (const userId of matchedUsers) {
            await cacheDel(`matches:${userId}`);
        }
        await cacheDel(`matches:${req.user._id}`);

        // Trigger match calculation if onboarding is complete
        if (req.user.isOnboardingComplete()) {
            findMatchesForUser(req.user._id).catch((err) =>
                console.error('Error finding matches:', err)
            );
        }

        res.status(200).json({
            success: true,
            message: 'Skills updated successfully',
            data: {
                skills: req.user.skills,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user goals (onboarding step 2)
// @route   PUT /api/users/onboarding/goals
// @access  Private
export const updateGoals = async (req, res, next) => {
    try {
        const { goals } = req.body;

        req.user.goals = goals;
        await req.user.save();

        // Invalidate cache for users who have this user in their matches
        const matchedUsers = await Match.find({ matchedUserId: req.user._id }).distinct('userId');
        for (const userId of matchedUsers) {
            await cacheDel(`matches:${userId}`);
        }
        await cacheDel(`matches:${req.user._id}`);

        // Trigger match calculation if onboarding is complete
        if (req.user.isOnboardingComplete()) {
            findMatchesForUser(req.user._id).catch((err) =>
                console.error('Error finding matches:', err)
            );
        }

        res.status(200).json({
            success: true,
            message: 'Goals updated successfully',
            data: {
                goals: req.user.goals,
                onboardingComplete: req.user.isOnboardingComplete(),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        res.status(200).json({
            success: true,
            data: {
                user: user.getPublicProfile(),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
    try {
        const { name, bio, location, collegeName } = req.body;

        if (name) req.user.name = name;
        if (bio) req.user.bio = bio;
        if (location) req.user.location = location;
        if (collegeName) req.user.collegeName = collegeName;

        await req.user.save();

        // Invalidate cache for users who have this user in their matches
        const matchedUsers = await Match.find({ matchedUserId: req.user._id }).distinct('userId');
        for (const userId of matchedUsers) {
            await cacheDel(`matches:${userId}`);
        }
        await cacheDel(`matches:${req.user._id}`);

        // Recalculate matches if location or collegeName changed
        if (location || collegeName) {
            findMatchesForUser(req.user._id).catch((err) =>
                console.error('Error finding matches:', err)
            );
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: req.user.getPublicProfile(),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload avatar
// @route   POST /api/users/avatar
// @access  Private
export const updateAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image file',
            });
        }

        req.user.avatar = `/uploads/${req.file.filename}`;
        await req.user.save();

        // Invalidate cache for users who have this user in their matches
        const matchedUsers = await Match.find({ matchedUserId: req.user._id }).distinct('userId');
        for (const userId of matchedUsers) {
            await cacheDel(`matches:${userId}`);
        }
        await cacheDel(`matches:${req.user._id}`);

        res.status(200).json({
            success: true,
            message: 'Avatar uploaded successfully',
            data: {
                avatar: req.user.avatar,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user: user.getPublicProfile(),
            },
        });
    } catch (error) {
        next(error);
    }
};
