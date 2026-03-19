import User from '../models/User.js';
import { generateOTP, sendOTPEmail, sendWelcomeEmail } from '../services/emailService.js';
import { trackEvent } from '../services/analyticsService.js';
import { AppError } from '../middleware/errorHandler.js';

// Helper function to validate college email
const isCollegeEmail = (email) => {
    const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',') || [
        '.edu',
        '.ac.in',
        '.edu.in',
    ];
    return allowedDomains.some((domain) => email.toLowerCase().endsWith(domain));
};

// @desc    Register user (direct signup without OTP)
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req, res, next) => {
    try {
        const { name, email, password, collegeName } = req.body;

        // Validate college email (optional - can be removed if not needed)
        // if (!isCollegeEmail(email)) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Please use a valid college email address (.edu, .ac.in, .edu.in)',
        //     });
        // }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email',
            });
        }

        // Create user directly (verified by default)
        const user = await User.create({
            name,
            email,
            password,
            collegeName,
            isVerified: true,
        });

        // Send welcome email (optional)
        try {
            await sendWelcomeEmail(email, name);
        } catch (emailError) {
            // Don't fail signup if email fails
            console.error('Welcome email failed:', emailError);
        }

        // Track signup event
        await trackEvent('user_signup', user._id, {
            email: user.email,
            name: user.name,
        });

        // Generate token
        const token = user.generateAuthToken();

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: {
                token,
                user: user.getPublicProfile(),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify OTP and complete registration
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        // Find user with OTP
        const user = await User.findOne({ email }).select('+otp +otpExpiry');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'User already verified',
            });
        }

        // Check OTP
        if (user.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP',
            });
        }

        // Check OTP expiry
        if (user.otpExpiry < Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one.',
            });
        }

        // Verify user
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        // Send welcome email
        await sendWelcomeEmail(user.email, user.name);

        // Track signup event
        await trackEvent('user_signup', user._id, {
            email: user.email,
            name: user.name,
        });

        // Generate token
        const token = user.generateAuthToken();

        res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            data: {
                token,
                user: user.getPublicProfile(),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'User already verified',
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // Send OTP email
        await sendOTPEmail(email, otp, user.name);

        res.status(200).json({
            success: true,
            message: 'New OTP sent to your email',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Removed email verification check - users are verified by default

        // Check password
        const isPasswordMatch = await user.comparePassword(password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Update online status
        user.isOnline = true;
        user.lastActive = Date.now();
        await user.save();

        // Track login event
        await trackEvent('user_login', user._id);

        // Generate token
        const token = user.generateAuthToken();

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: user.getPublicProfile(),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        res.status(200).json({
            success: true,
            data: {
                user: user.getPublicProfile(),
                onboardingComplete: user.isOnboardingComplete(),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
    try {
        // Update online status
        req.user.isOnline = false;
        req.user.lastActive = Date.now();
        await req.user.save();

        res.status(200).json({
            success: true,
            message: 'Logout successful',
        });
    } catch (error) {
        next(error);
    }
};
