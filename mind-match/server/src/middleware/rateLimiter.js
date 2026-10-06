import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs:
        parseInt(process.env.RATE_LIMIT_WINDOW_MS) ||
        15 * 60 * 1000,

    max:
        parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) ||
        100,

    message: {
        success: false,
        message: 'Too many requests, please try again later',
    },

    standardHeaders: true,
    legacyHeaders: false,
});

// Authentication rate limiter
// Increased for local development/testing.
// In production, use a lower limit.
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    // Previously: 5
    // Development/testing: 30
    max: 30,

    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later',
    },

    // Successful login requests don't count toward the limit
    skipSuccessfulRequests: true,

    standardHeaders: true,
    legacyHeaders: false,
});

// OTP rate limiter
export const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,

    max: 3,

    message: {
        success: false,
        message: 'Too many OTP requests, please try again later',
    },
});