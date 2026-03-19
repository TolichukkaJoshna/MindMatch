import Skill from '../models/Skill.js';

// @desc    Get all skills
// @route   GET /api/skills
// @access  Public
export const getAllSkills = async (req, res, next) => {
    try {
        const { category, search, limit = 50 } = req.query;

        const query = {};

        if (category) {
            query.category = category;
        }

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const skills = await Skill.find(query)
            .sort({ popularityScore: -1, name: 1 })
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            count: skills.length,
            data: {
                skills,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get skill suggestions
// @route   GET /api/skills/suggestions
// @access  Public
export const getSkillSuggestions = async (req, res, next) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required',
            });
        }

        const skills = await Skill.find({
            name: { $regex: query, $options: 'i' },
        })
            .sort({ popularityScore: -1 })
            .limit(10)
            .select('name category');

        res.status(200).json({
            success: true,
            data: {
                suggestions: skills.map((s) => s.name),
            },
        });
    } catch (error) {
        next(error);
    }
};
