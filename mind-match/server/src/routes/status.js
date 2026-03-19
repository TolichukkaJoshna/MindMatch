import express from 'express';
import { updateStatus, getStatusFeed, deleteStatus } from '../controllers/statusController.js';
import { protect } from '../middleware/auth.js';
import { requireOnboarding } from '../middleware/onboardingCheck.js';
import { statusValidation, validate } from '../middleware/validation.js';

const router = express.Router();

// All routes are protected and require onboarding
router.use(protect, requireOnboarding);

router.post('/', statusValidation, validate, updateStatus);
router.get('/feed', getStatusFeed);
router.delete('/', deleteStatus);

export default router;
