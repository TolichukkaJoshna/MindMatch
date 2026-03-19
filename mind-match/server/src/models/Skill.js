import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        category: {
            type: String,
            enum: [
                'programming',
                'web-development',
                'mobile-development',
                'data-science',
                'design',
                'other',
            ],
            default: 'other',
        },
        popularityScore: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes (name index is created automatically by unique: true)
skillSchema.index({ category: 1 });
skillSchema.index({ popularityScore: -1 });

const Skill = mongoose.model('Skill', skillSchema);

export default Skill;
