import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide a name'],
            trim: true,
        },
        collegeName: {
            type: String,
            required: [true, 'Please provide your college name'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Please provide an email'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email',
            ],
        },
        password: {
            type: String,
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        avatar: {
            type: String,
            default: '',
        },
        // Contact Information
        secondaryEmail: {
            type: String,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        socialLinks: {
            linkedin: String,
            github: String,
            portfolio: String,
            twitter: String,
            other: String,
        },
        // Personal Information
        dateOfBirth: {
            type: Date,
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'non-binary', 'prefer-not-to-say', ''],
            default: '',
        },
        // Residential Information
        address: {
            street: String,
            city: String,
            state: String,
            country: String,
            zipCode: String,
        },
        timezone: {
            type: String,
            default: 'UTC',
        },
        willingToRelocate: {
            type: Boolean,
            default: false,
        },
        // Academic Background
        academicInfo: {
            degree: String,
            fieldOfStudy: String,
            graduationYear: Number,
            gpa: Number,
            achievements: [String],
            certifications: [
                {
                    name: String,
                    issuer: String,
                    issueDate: Date,
                    expiryDate: Date,
                    credentialId: String,
                    credentialUrl: String,
                }
            ],
        },
        // Professional Experience
        employmentStatus: {
            type: String,
            enum: ['student', 'employed-full-time', 'employed-part-time', 'freelancer', 'looking-for-work', 'entrepreneur', ''],
            default: 'student',
        },
        experience: [
            {
                company: String,
                position: String,
                employmentType: {
                    type: String,
                    enum: ['full-time', 'part-time', 'internship', 'freelance', 'contract'],
                },
                startDate: Date,
                endDate: Date,
                isCurrent: {
                    type: Boolean,
                    default: false,
                },
                description: String,
                responsibilities: [String],
                technologies: [String],
                achievements: [String],
            }
        ],
        // Career Goals
        careerGoals: {
            shortTerm: [String],
            longTerm: [String],
            dreamCompanies: [String],
            preferredRoles: [String],
            industriesOfInterest: [String],
        },
        // Project Portfolio
        projects: [
            {
                title: String,
                description: String,
                projectType: {
                    type: String,
                    enum: ['personal', 'academic', 'professional', 'open-source'],
                },
                technologies: [String],
                role: String,
                startDate: Date,
                endDate: Date,
                isOngoing: {
                    type: Boolean,
                    default: false,
                },
                githubUrl: String,
                liveUrl: String,
                imageUrl: String,
                achievements: [String],
            }
        ],
        // Languages
        languages: [
            {
                language: String,
                proficiency: {
                    type: String,
                    enum: ['basic', 'conversational', 'fluent', 'native'],
                },
            }
        ],
        isVerified: {
            type: Boolean,
            default: false,
        },
        otp: {
            type: String,
            select: false,
        },
        otpExpiry: {
            type: Date,
            select: false,
        },
        skills: [
            {
                skillId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Skill',
                },
                skillName: String,
                level: {
                    type: String,
                    enum: ['beginner', 'intermediate', 'advanced'],
                },
                isVerified: {
                    type: Boolean,
                    default: false,
                },
                verifiedAt: Date,
            },
        ],
        goals: [
            {
                type: String,
                enum: ['placement', 'internship', 'hackathon', 'project', 'casual'],
            },
        ],
        location: {
            college: String,
            city: String,
            country: String,
        },
        bio: {
            type: String,
            maxlength: 500,
        },
        isOnline: {
            type: Boolean,
            default: false,
        },
        lastActive: {
            type: Date,
            default: Date.now,
        },
        googleId: {
            type: String,
            sparse: true,
        },
        role: {
            type: String,
            enum: ['student', 'mentor', 'admin'],
            default: 'student',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes (email index is created automatically by unique: true)
userSchema.index({ 'skills.skillName': 1 });
userSchema.index({ 'location.college': 1 });
userSchema.index({ isOnline: 1 });
userSchema.index({ employmentStatus: 1 });
userSchema.index({ 'academicInfo.graduationYear': 1 });
userSchema.index({ 'careerGoals.preferredRoles': 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    if (this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
    return jwt.sign(
        { id: this._id, email: this.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Check if onboarding is complete
userSchema.methods.isOnboardingComplete = function () {
    return this.skills.length > 0 && this.goals.length > 0;
};

// Get public profile (with privacy filtering applied by controller)
userSchema.methods.getPublicProfile = function () {
    return {
        _id: this._id,
        name: this.name,
        email: this.email,
        avatar: this.avatar,
        phone: this.phone,
        socialLinks: this.socialLinks,
        dateOfBirth: this.dateOfBirth,
        gender: this.gender,
        timezone: this.timezone,
        willingToRelocate: this.willingToRelocate,
        academicInfo: this.academicInfo,
        employmentStatus: this.employmentStatus,
        experience: this.experience,
        careerGoals: this.careerGoals,
        projects: this.projects,
        languages: this.languages,
        skills: this.skills,
        goals: this.goals,
        location: this.location,
        bio: this.bio,
        isOnline: this.isOnline,
        lastActive: this.lastActive,
        collegeName: this.collegeName,
        createdAt: this.createdAt,
    };
};

const User = mongoose.model('User', userSchema);

export default User;
