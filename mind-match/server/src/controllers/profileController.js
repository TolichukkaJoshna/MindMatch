import User from '../models/User.js';
import ProfilePrivacy from '../models/ProfilePrivacy.js';
import ProfileVerification from '../models/ProfileVerification.js';
import { AppError } from '../middleware/errorHandler.js';
import { trackEvent } from '../services/analyticsService.js';

// @desc    Get user profile with privacy filtering
// @route   GET /api/profile/:userId
// @access  Private
export const getUserProfile = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const viewerId = req.user._id;

        // Get user profile
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Get privacy settings
        let privacy = await ProfilePrivacy.findOne({ userId });
        if (!privacy) {
            // Create default privacy settings if not exists
            privacy = await ProfilePrivacy.create({ userId });
        }

        // Get verification status
        const verification = await ProfileVerification.findOne({ userId });

        // Check if viewer is connected to user
        const isConnection = false; // TODO: Implement connection check from StudyRequest model
        const isSelf = viewerId.toString() === userId.toString();

        // Build filtered profile based on privacy settings
        const profile = user.getPublicProfile();
        
        if (!isSelf) {
            // Filter fields based on privacy settings
            const filteredProfile = {};
            
            for (const [field, value] of Object.entries(profile)) {
                if (field === '_id' || field === 'name' || field === 'avatar') {
                    // Always visible
                    filteredProfile[field] = value;
                } else {
                    const isVisible = privacy.isFieldVisible(field, viewerId, isConnection);
                    if (isVisible) {
                        filteredProfile[field] = value;
                    }
                }
            }
            
            res.status(200).json({
                success: true,
                data: {
                    profile: filteredProfile,
                    verification: verification ? {
                        badges: verification.badges,
                        verificationScore: verification.overallVerificationScore,
                    } : null,
                },
            });
        } else {
            // Return full profile for self
            res.status(200).json({
                success: true,
                data: {
                    profile,
                    privacy: privacy.fieldVisibility,
                    verification: verification ? {
                        badges: verification.badges,
                        verificationScore: verification.overallVerificationScore,
                        emailVerified: verification.emailVerified,
                        collegeVerified: verification.collegeVerified,
                        skillVerifications: verification.skillVerifications,
                        experienceVerified: verification.experienceVerified,
                    } : null,
                },
            });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update own profile
// @route   PUT /api/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const updates = req.body;

        // Fields that can be updated
        const allowedUpdates = [
            'phone', 'secondaryEmail', 'socialLinks', 'dateOfBirth', 'gender',
            'address', 'timezone', 'willingToRelocate', 'academicInfo',
            'employmentStatus', 'experience', 'careerGoals', 'projects',
            'languages', 'bio', 'location'
        ];

        // Filter updates to only allowed fields
        const filteredUpdates = {};
        for (const key of allowedUpdates) {
            if (updates[key] !== undefined) {
                filteredUpdates[key] = updates[key];
            }
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: filteredUpdates },
            { new: true, runValidators: true }
        );

        // Track event
        await trackEvent('profile_updated', userId, { fields: Object.keys(filteredUpdates) });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                profile: user.getPublicProfile(),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update privacy settings
// @route   PUT /api/profile/privacy
// @access  Private
export const updatePrivacySettings = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { fieldVisibility, profileVisibility } = req.body;

        let privacy = await ProfilePrivacy.findOne({ userId });
        
        if (!privacy) {
            privacy = new ProfilePrivacy({ userId });
        }

        if (fieldVisibility) {
            privacy.fieldVisibility = { ...privacy.fieldVisibility, ...fieldVisibility };
        }

        if (profileVisibility) {
            privacy.profileVisibility = profileVisibility;
        }

        await privacy.save();

        res.status(200).json({
            success: true,
            message: 'Privacy settings updated',
            data: {
                privacy: privacy.fieldVisibility,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Submit college verification
// @route   POST /api/profile/verify/college
// @access  Private
export const submitCollegeVerification = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { method, documentUrl, eduEmail } = req.body;

        let verification = await ProfileVerification.findOne({ userId });
        
        if (!verification) {
            verification = new ProfileVerification({ userId });
        }

        if (method === 'edu-email') {
            // Verify .edu email
            if (!eduEmail || !eduEmail.endsWith('.edu')) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid .edu email address',
                });
            }
            
            // TODO: Send verification email to .edu address
            verification.collegeVerificationMethod = 'edu-email';
            verification.collegeVerified = true; // Auto-verify for now
            verification.collegeVerifiedAt = new Date();
        } else if (method === 'document') {
            if (!documentUrl) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a document URL',
                });
            }
            
            verification.collegeVerificationMethod = 'document';
            verification.collegeVerificationDocument = {
                url: documentUrl,
                uploadedAt: new Date(),
            };
            // Requires admin approval
        }

        await verification.save();

        res.status(200).json({
            success: true,
            message: 'College verification submitted',
            data: {
                verification: {
                    collegeVerified: verification.collegeVerified,
                    method: verification.collegeVerificationMethod,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Submit skill verification
// @route   POST /api/profile/verify/skill
// @access  Private
export const submitSkillVerification = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { skillName, method, verificationData } = req.body;

        let verification = await ProfileVerification.findOne({ userId });
        
        if (!verification) {
            verification = new ProfileVerification({ userId });
        }

        // Check if skill already verified
        const existingVerification = verification.skillVerifications.find(
            sv => sv.skillName === skillName
        );

        if (existingVerification) {
            return res.status(400).json({
                success: false,
                message: 'Skill already verified',
            });
        }

        // Add skill verification
        verification.skillVerifications.push({
            skillName,
            verified: true, // Auto-verify for now
            verificationMethod: method,
            verificationData,
            verifiedAt: new Date(),
        });

        // Update skill in user model
        const user = await User.findById(userId);
        const skillIndex = user.skills.findIndex(s => s.skillName === skillName);
        if (skillIndex !== -1) {
            user.skills[skillIndex].isVerified = true;
            user.skills[skillIndex].verifiedAt = new Date();
            await user.save();
        }

        await verification.save();

        res.status(200).json({
            success: true,
            message: 'Skill verification submitted',
            data: {
                verification: {
                    skillName,
                    verified: true,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get verification status
// @route   GET /api/profile/verification-status
// @access  Private
export const getVerificationStatus = async (req, res, next) => {
    try {
        const userId = req.user._id;

        let verification = await ProfileVerification.findOne({ userId });
        
        if (!verification) {
            verification = new ProfileVerification({ userId });
            await verification.save();
        }

        res.status(200).json({
            success: true,
            data: {
                emailVerified: verification.emailVerified,
                collegeVerified: verification.collegeVerified,
                skillVerifications: verification.skillVerifications,
                experienceVerified: verification.experienceVerified,
                badges: verification.badges,
                verificationScore: verification.overallVerificationScore,
            },
        });
    } catch (error) {
        next(error);
    }
};
