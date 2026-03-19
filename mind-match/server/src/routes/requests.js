import express from 'express';
import {
    sendRequest,
    getReceivedRequests,
    getSentRequests,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    getConnectionStatus,
} from '../controllers/requestController.js';
import { protect } from '../middleware/auth.js';
import { requireOnboarding } from '../middleware/onboardingCheck.js';
import { studyRequestValidation, validate } from '../middleware/validation.js';

const router = express.Router();

// All routes are protected and require onboarding
router.use(protect, requireOnboarding);

router.post('/send', studyRequestValidation, validate, sendRequest);
router.get('/received', getReceivedRequests);
router.get('/sent', getSentRequests);
router.get('/status/:userId', getConnectionStatus);
router.put('/:id/accept', acceptRequest);
router.put('/:id/reject', rejectRequest);
router.delete('/:id/cancel', cancelRequest);

export default router;
