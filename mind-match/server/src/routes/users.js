import express from 'express';
import {
    updateSkills,
    updateGoals,
    getProfile,
    updateProfile,
    updateAvatar,
    uploadAvatar,
    getUserById,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { skillsValidation, goalsValidation, validate } from '../middleware/validation.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Onboarding routes
router.put('/onboarding/skills', skillsValidation, validate, updateSkills);
router.put('/onboarding/goals', goalsValidation, validate, updateGoals);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/avatar', uploadAvatar, updateAvatar);

// Get user by ID
router.get('/:id', getUserById);

export default router;
