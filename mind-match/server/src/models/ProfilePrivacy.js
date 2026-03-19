import mongoose from 'mongoose';

const profilePrivacySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        // Field visibility settings
        fieldVisibility: {
            // Contact Information
            email: {
                type: String,
                enum: ['public', 'connections', 'custom', 'private'],
                default: 'connections',
            },
            secondaryEmail: {
                type: String,
                enum: ['public', 'connections', 'custom', 'private'],
                default: 'private',
            },
            phone: {
                type: String,
                enum: ['public', 'connections', 'custom', 'private'],
                default: 'connections',
            },
            socialLinks: {
                type: String,
                enum: ['public', 'connections', 'custom', 'private'],
                default: 'public',
            },
            // Personal Information
            dateOfBirth: {
                type: String,
                enum: ['public', 'connections', 'custom', 'private'],
                default: 'private',
            },
            gender: {
                type: String,
                enum: ['public', 'connections', 'custom', 'private'],
                default: 'connections',
            },
            // Residential Information
            address: {
                type: String,
                enum: ['public', 'connections', 'custom', 'private'],
                default: 'private',
            },
            timezone: {
                type: String,
                enum: ['public', 'connections', 'custom', 'private'],
                default: 'public',
            },
            willingToRelocate: {
                type: String,
                enum: ['public', 'connections', 'custom', 'private'],
                default: 'public',
            },
            // Academic & Professional
            academicInfo: {
                type: String,
                enum: ['public', 'connections', 'custom', 'private'],
                default: 'public',
            },
            employmentStatus: {
                type: String,
                enum: ['public', 'connections', 'custom', 'private'],
                default: 'public',
            },
            experience: {
                type: String,
                enum: ['public', 'connections', 'custom', 'private'],
                default: 'public',
            },
            careerGoals: {
                type: String,
                enum: ['public', 'connections', 'custom', 'private'],
                default: 'connections',
            },
            projects: {
                type: String,
                enum: ['public', 'connections', 'custom', 'private'],
                default: 'public',
            },
            languages: {
                type: String,
                enum: ['public', 'connections', 'custom', 'private'],
                default: 'public',
            },
            skills: {
                type: String,
                enum: ['public', 'connections', 'custom', 'private'],
                default: 'public',
            },
            bio: {
                type: String,
                enum: ['public', 'connections', 'custom', 'private'],
                default: 'public',
            },
        },
        // Custom visibility - specific users who can see certain fields
        customVisibility: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                fields: [String], // Array of field names
                expiresAt: Date, // Temporary sharing
            }
        ],
        // Profile visibility presets
        profileVisibility: {
            type: String,
            enum: ['public', 'connections-only', 'private'],
            default: 'public',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
profilePrivacySchema.index({ userId: 1 });

// Method to check if a field is visible to a viewer
profilePrivacySchema.methods.isFieldVisible = function (fieldName, viewerId, isConnection) {
    const visibility = this.fieldVisibility[fieldName];
    
    if (!visibility || visibility === 'public') return true;
    if (visibility === 'private') return false;
    if (visibility === 'connections' && isConnection) return true;
    
    // Check custom visibility
    if (visibility === 'custom') {
        const customAccess = this.customVisibility.find(
            cv => cv.userId.toString() === viewerId.toString() &&
                  cv.fields.includes(fieldName) &&
                  (!cv.expiresAt || cv.expiresAt > new Date())
        );
        return !!customAccess;
    }
    
    return false;
};

const ProfilePrivacy = mongoose.model('ProfilePrivacy', profilePrivacySchema);

export default ProfilePrivacy;
