import { body, validationResult } from 'express-validator';

// Validation result checker
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map((err) => ({
                field: err.path,
                message: err.msg,
            })),
        });
    }
    next();
};

// Signup validation
export const signupValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
];

// Login validation
export const loginValidation = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
];

// OTP validation
export const otpValidation = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('otp')
        .notEmpty()
        .withMessage('OTP is required')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 digits'),
];

// Skills validation
export const skillsValidation = [
    body('skills')
        .isArray({ min: 1, max: 10 })
        .withMessage('Please select between 1 and 10 skills'),
    body('skills.*.skillName')
        .trim()
        .notEmpty()
        .withMessage('Skill name is required'),
    body('skills.*.level')
        .isIn(['beginner', 'intermediate', 'advanced'])
        .withMessage('Invalid skill level'),
];

// Goals validation
export const goalsValidation = [
    body('goals')
        .isArray({ min: 1 })
        .withMessage('Please select at least one goal'),
    body('goals.*')
        .isIn(['placement', 'internship', 'hackathon', 'project', 'casual'])
        .withMessage('Invalid goal'),
];

// Study request validation
export const studyRequestValidation = [
    body('toUser').notEmpty().withMessage('Recipient user ID is required'),
    body('message')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Message must be less than 500 characters'),
];

// Resource validation
export const resourceValidation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ max: 200 })
        .withMessage('Title must be less than 200 characters'),
    body('link').trim().notEmpty().withMessage('Link is required').isURL().withMessage('Please provide a valid URL'),
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description must be less than 1000 characters'),
    body('tags')
        .optional()
        .isArray({ max: 5 })
        .withMessage('Maximum 5 tags allowed'),
];

// Group validation
export const groupValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Group name is required')
        .isLength({ max: 100 })
        .withMessage('Name must be less than 100 characters'),
    body('topic').trim().notEmpty().withMessage('Topic is required'),
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description must be less than 1000 characters'),
    body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
];

// Status validation
export const statusValidation = [
    body('activityText')
        .trim()
        .notEmpty()
        .withMessage('Activity text is required')
        .isLength({ max: 200 })
        .withMessage('Activity text must be less than 200 characters'),
];
