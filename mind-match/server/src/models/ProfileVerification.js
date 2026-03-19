import mongoose from 'mongoose';

const profileVerificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        // Email Verification
        emailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerifiedAt: {
            type: Date,
        },
        // College Verification
        collegeVerified: {
            type: Boolean,
            default: false,
        },
        collegeVerificationMethod: {
            type: String,
            enum: ['edu-email', 'document', 'admin-approved', ''],
            default: '',
        },
        collegeVerificationDocument: {
            url: String,
            uploadedAt: Date,
        },
        collegeVerifiedAt: {
            type: Date,
        },
        collegeVerifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        // Skill Verifications
        skillVerifications: [
            {
                skillName: String,
                verified: {
                    type: Boolean,
                    default: false,
                },
                verificationMethod: {
                    type: String,
                    enum: ['test', 'project', 'endorsement', 'certificate'],
                },
                verificationData: {
                    testScore: Number,
                    projectUrl: String,
                    certificateUrl: String,
                    endorsedBy: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'User',
                    },
                },
                verifiedAt: Date,
            }
        ],
        // Experience Verification
        experienceVerified: {
            type: Boolean,
            default: false,
        },
        experienceVerificationMethod: {
            type: String,
            enum: ['linkedin-import', 'document', 'reference', ''],
            default: '',
        },
        experienceVerificationData: {
            linkedinUrl: String,
            documents: [
                {
                    company: String,
                    documentUrl: String,
                    uploadedAt: Date,
                }
            ],
            references: [
                {
                    name: String,
                    email: String,
                    company: String,
                    verified: Boolean,
                    verifiedAt: Date,
                }
            ],
        },
        experienceVerifiedAt: {
            type: Date,
        },
        // Badges Earned
        badges: [
            {
                type: String,
                enum: [
                    'verified-email',
                    'verified-college',
                    'verified-skills',
                    'verified-experience',
                    'top-contributor',
                    'active-networker',
                    'project-showcase',
                    'mentor',
                ],
            }
        ],
        // Verification Status
        overallVerificationScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
profileVerificationSchema.index({ userId: 1 });
profileVerificationSchema.index({ overallVerificationScore: -1 });

// Method to calculate overall verification score
profileVerificationSchema.methods.calculateVerificationScore = function () {
    let score = 0;
    
    // Email verification (20 points)
    if (this.emailVerified) score += 20;
    
    // College verification (30 points)
    if (this.collegeVerified) score += 30;
    
    // Skill verifications (30 points max, 5 points per verified skill, max 6 skills)
    const verifiedSkills = this.skillVerifications.filter(sv => sv.verified).length;
    score += Math.min(verifiedSkills * 5, 30);
    
    // Experience verification (20 points)
    if (this.experienceVerified) score += 20;
    
    this.overallVerificationScore = score;
    return score;
};

// Method to update badges based on verifications
profileVerificationSchema.methods.updateBadges = function () {
    const badges = [];
    
    if (this.emailVerified) badges.push('verified-email');
    if (this.collegeVerified) badges.push('verified-college');
    if (this.skillVerifications.filter(sv => sv.verified).length >= 3) {
        badges.push('verified-skills');
    }
    if (this.experienceVerified) badges.push('verified-experience');
    
    this.badges = badges;
};

// Pre-save hook to calculate score and update badges
profileVerificationSchema.pre('save', function (next) {
    this.calculateVerificationScore();
    this.updateBadges();
    next();
});

const ProfileVerification = mongoose.model('ProfileVerification', profileVerificationSchema);

export default ProfileVerification;
