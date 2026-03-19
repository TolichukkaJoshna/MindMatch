import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
    {
        eventType: {
            type: String,
            required: true,
            enum: [
                'user_login',
                'user_signup',
                'match_viewed',
                'request_sent',
                'request_accepted',
                'message_sent',
                'group_created',
                'group_joined',
                'resource_posted',
                'resource_upvoted',
            ],
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
analyticsSchema.index({ eventType: 1, createdAt: -1 });
analyticsSchema.index({ userId: 1, createdAt: -1 });

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;
