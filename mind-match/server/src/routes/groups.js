import express from 'express';
import {
    createGroup,
    getRecommendedGroups,
    joinGroup,
    leaveGroup,
    getMyGroups,
    getGroupById,
} from '../controllers/groupController.js';
import { protect } from '../middleware/auth.js';
import { requireOnboarding } from '../middleware/onboardingCheck.js';
import { groupValidation, validate } from '../middleware/validation.js';

const router = express.Router();

// All routes are protected and require onboarding
router.use(protect, requireOnboarding);

router.post('/', groupValidation, validate, createGroup);
router.get('/recommended', getRecommendedGroups);
router.get('/my-groups', getMyGroups);
router.get('/:id', getGroupById);
router.post('/:id/join', joinGroup);
router.post('/:id/leave', leaveGroup);

export default router;
