import mongoose from 'mongoose';

const statusSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        activityText: {
            type: String,
            required: true,
            maxlength: 200,
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
            index: { expires: 0 }, // TTL index
        },
    },
    {
        timestamps: true,
    }
);

// Indexes (expiresAt TTL index is created automatically in schema)
statusSchema.index({ userId: 1 });

const Status = mongoose.model('Status', statusSchema);

export default Status;
