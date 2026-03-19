export const requireOnboarding = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
    }

    if (!req.user.isOnboardingComplete()) {
        return res.status(403).json({
            success: false,
            message: 'Please complete onboarding first',
            onboardingRequired: true,
            missingFields: {
                skills: req.user.skills.length === 0,
                goals: req.user.goals.length === 0,
            },
        });
    }

    next();
};
