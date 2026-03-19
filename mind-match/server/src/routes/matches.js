import express from 'express';
import { getRecommendedMatches, refreshMatches } from '../controllers/matchController.js';
import { protect } from '../middleware/auth.js';
import { requireOnboarding } from '../middleware/onboardingCheck.js';

const router = express.Router();

// All routes are protected and require onboarding
router.use(protect, requireOnboarding);

router.get('/recommended', getRecommendedMatches);
router.post('/refresh', refreshMatches);

export default router;
