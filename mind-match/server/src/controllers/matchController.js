import Match from '../models/Match.js';
import User from '../models/User.js';
import { findMatchesForUser } from '../services/matchingEngine.js';
import { cacheGet, cacheSet } from '../config/redis.js';
import { trackEvent } from '../services/analyticsService.js';

// @desc    Get recommended matches
// @route   GET /api/matches/recommended
// @access  Private
export const getRecommendedMatches = async (req, res, next) => {
    try {
        const { limit = 20, minScore = 30 } = req.query;

        // Check cache first
        const cacheKey = `matches:${req.user._id}`;
        const cachedMatches = await cacheGet(cacheKey);

        if (cachedMatches) {
            return res.status(200).json({
                success: true,
                count: cachedMatches.length,
                data: {
                    matches: cachedMatches,
                },
                cached: true,
            });
        }

        // Get matches from database
        let matches = await Match.find({
            userId: req.user._id,
            score: { $gte: parseInt(minScore) },
        })
            .sort({ score: -1 })
            .limit(parseInt(limit))
            .populate('matchedUserId', 'name email avatar skills goals location isOnline lastActive collegeName');

        // If no matches found, calculate them
        if (matches.length === 0) {
            await findMatchesForUser(req.user._id);
            matches = await Match.find({
                userId: req.user._id,
                score: { $gte: parseInt(minScore) },
            })
                .sort({ score: -1 })
                .limit(parseInt(limit))
                .populate('matchedUserId', 'name email avatar skills goals location isOnline lastActive collegeName');
        }

        // Format response
        const formattedMatches = matches.map((match) => ({
            _id: match.matchedUserId._id,
            name: match.matchedUserId.name,
            email: match.matchedUserId.email,
            avatar: match.matchedUserId.avatar,
            skills: match.matchedUserId.skills,
            goals: match.matchedUserId.goals,
            location: match.matchedUserId.location,
            isOnline: match.matchedUserId.isOnline,
            lastActive: match.matchedUserId.lastActive,
            matchScore: match.score,
            breakdown: match.breakdown,
            commonSkills: match.commonSkills,
            collegeName: match.matchedUserId.collegeName,
        }));

        // Cache results for 1 hour
        await cacheSet(cacheKey, formattedMatches, 3600);

        // Track event
        await trackEvent('match_viewed', req.user._id, {
            matchCount: formattedMatches.length,
        });

        res.status(200).json({
            success: true,
            count: formattedMatches.length,
            data: {
                matches: formattedMatches,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Refresh matches for current user
// @route   POST /api/matches/refresh
// @access  Private
export const refreshMatches = async (req, res, next) => {
    try {
        if (!req.user.isOnboardingComplete()) {
            return res.status(400).json({
                success: false,
                message: 'Please complete onboarding first',
            });
        }

        await findMatchesForUser(req.user._id);

        res.status(200).json({
            success: true,
            message: 'Matches refreshed successfully',
        });
    } catch (error) {
        next(error);
    }
};
