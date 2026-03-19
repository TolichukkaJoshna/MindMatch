import express from 'express';
import {
    signup,
    verifyOTP,
    resendOTP,
    login,
    getMe,
    logout,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import {
    signupValidation,
    loginValidation,
    otpValidation,
    validate,
} from '../middleware/validation.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.post('/signup', authLimiter, signupValidation, validate, signup);
router.post('/verify-otp', authLimiter, otpValidation, validate, verifyOTP);
router.post('/resend-otp', otpLimiter, resendOTP);
router.post('/login', authLimiter, loginValidation, validate, login);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;
