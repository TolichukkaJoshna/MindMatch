import mongoose from 'mongoose';

const studyRequestSchema = new mongoose.Schema(
    {
        fromUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        toUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending',
        },
        message: {
            type: String,
            maxlength: 500,
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
studyRequestSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });
studyRequestSchema.index({ toUser: 1, status: 1 });
studyRequestSchema.index({ fromUser: 1, status: 1 });

// TTL index - auto-delete expired requests
studyRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const StudyRequest = mongoose.model('StudyRequest', studyRequestSchema);

export default StudyRequest;
