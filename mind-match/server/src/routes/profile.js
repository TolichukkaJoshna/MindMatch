import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    getUserProfile,
    updateProfile,
    updatePrivacySettings,
    submitCollegeVerification,
    submitSkillVerification,
    getVerificationStatus,
} from '../controllers/profileController.js';

const router = express.Router();

// Profile routes
router.get('/:userId', protect, getUserProfile);
router.put('/', protect, updateProfile);

// Privacy routes
router.put('/privacy', protect, updatePrivacySettings);

// Verification routes
router.post('/verify/college', protect, submitCollegeVerification);
router.post('/verify/skill', protect, submitSkillVerification);
router.get('/verification-status', protect, getVerificationStatus);

export default router;
