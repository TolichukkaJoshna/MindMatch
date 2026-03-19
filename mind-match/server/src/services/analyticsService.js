import Analytics from '../models/Analytics.js';

// Track an event
export const trackEvent = async (eventType, userId, metadata = {}) => {
    try {
        await Analytics.create({
            eventType,
            userId,
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
            query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
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
