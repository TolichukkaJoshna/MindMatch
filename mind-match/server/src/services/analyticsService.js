import Analytics from '../models/Analytics.js';

// Get the actual user ID whether userId is:
// "64abc..."
// or
// { userId: "64abc..." }
const normalizeUserId = (userId) => {
    if (!userId) {
        return null;
    }

    if (typeof userId === 'object' && userId.userId) {
        return userId.userId;
    }

    return userId;
};

// Track an event
export const trackEvent = async (eventType, userId, metadata = {}) => {
    try {
        const normalizedUserId = normalizeUserId(userId);

        if (!normalizedUserId) {
            console.warn(
                `[Analytics] Skipping event "${eventType}" because userId is missing`
            );
            return;
        }

        await Analytics.create({
            eventType,
            userId: normalizedUserId,
            metadata,
        });
    } catch (error) {
        console.error('Error tracking event:', error);
        // Don't throw - analytics shouldn't break the app
    }
};

// Get analytics summary
export const getAnalyticsSummary = async (startDate, endDate) => {
    try {
        const query = {};

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const summary = await Analytics.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$eventType',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ]);

        return summary;
    } catch (error) {
        console.error('Error getting analytics summary:', error);
        return [];
    }
};

// Get popular skills
export const getPopularSkills = async (limit = 10) => {
    try {
        const skills = await Analytics.aggregate([
            { $match: { eventType: 'user_signup' } },
            { $unwind: '$metadata.skills' },
            {
                $group: {
                    _id: '$metadata.skills',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: limit },
        ]);

        return skills;
    } catch (error) {
        console.error('Error getting popular skills:', error);
        return [];
    }
};

// Get active users count
export const getActiveUsersCount = async (days = 7) => {
    try {
        const date = new Date();
        date.setDate(date.getDate() - days);

        const count = await Analytics.distinct('userId', {
            createdAt: { $gte: date },
        });

        return count.length;
    } catch (error) {
        console.error('Error getting active users count:', error);
        return 0;
    }
};