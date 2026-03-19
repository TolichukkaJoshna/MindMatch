import express from 'express';
import { getAllSkills, getSkillSuggestions } from '../controllers/skillController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes (optional auth)
router.get('/', optionalAuth, getAllSkills);
router.get('/suggestions', optionalAuth, getSkillSuggestions);

export default router;
