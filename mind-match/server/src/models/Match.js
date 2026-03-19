import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        matchedUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        score: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        breakdown: {
            skillMatch: Number,
            locationMatch: Number,
            goalMatch: Number,
        },
        commonSkills: [String],
    },
    {
        timestamps: true,
    }
);

// Indexes
matchSchema.index({ userId: 1, score: -1 });
matchSchema.index({ matchedUserId: 1 });
matchSchema.index({ userId: 1, matchedUserId: 1 }, { unique: true });

// TTL index - matches expire after 7 days
matchSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

const Match = mongoose.model('Match', matchSchema);

export default Match;
