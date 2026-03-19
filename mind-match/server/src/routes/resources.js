import express from 'express';
import {
    postResource,
    getResources,
    getTopResources,
    upvoteResource,
    downvoteResource,
} from '../controllers/resourceController.js';
import { protect } from '../middleware/auth.js';
import { requireOnboarding } from '../middleware/onboardingCheck.js';
import { resourceValidation, validate } from '../middleware/validation.js';

const router = express.Router();

// All routes are protected and require onboarding
router.use(protect, requireOnboarding);

router.post('/', resourceValidation, validate, postResource);
router.get('/', getResources);
router.get('/top', getTopResources);
router.post('/:id/upvote', upvoteResource);
router.post('/:id/downvote', downvoteResource);

export default router;
