import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        topic: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            maxlength: 1000,
        },
        creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        members: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                role: {
                    type: String,
                    enum: ['admin', 'member'],
                    default: 'member',
                },
                joinedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        isPublic: {
            type: Boolean,
            default: true,
        },
        tags: [String],
        activityScore: {
            type: Number,
            default: 0,
        },
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
groupSchema.index({ topic: 1 });
groupSchema.index({ tags: 1 });
groupSchema.index({ activityScore: -1 });
groupSchema.index({ isPublic: 1 });

const Group = mongoose.model('Group', groupSchema);

export default Group;
