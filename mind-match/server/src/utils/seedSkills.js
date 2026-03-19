import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Skill from '../models/Skill.js';
import connectDB from '../config/database.js';

dotenv.config();

const skills = [
    { name: 'React', category: 'web-development', popularityScore: 95 },
    { name: 'Node.js', category: 'web-development', popularityScore: 90 },
    { name: 'Python', category: 'programming', popularityScore: 98 },
    { name: 'Java', category: 'programming', popularityScore: 85 },
    { name: 'C++', category: 'programming', popularityScore: 80 },
    { name: 'JavaScript', category: 'programming', popularityScore: 97 },
    { name: 'TypeScript', category: 'programming', popularityScore: 88 },
    { name: 'Data Structures', category: 'programming', popularityScore: 92 },
    { name: 'Algorithms', category: 'programming', popularityScore: 90 },
    { name: 'Machine Learning', category: 'data-science', popularityScore: 93 },
    { name: 'Deep Learning', category: 'data-science', popularityScore: 85 },
    { name: 'Data Science', category: 'data-science', popularityScore: 88 },
    { name: 'UI/UX Design', category: 'design', popularityScore: 82 },
    { name: 'Figma', category: 'design', popularityScore: 78 },
    { name: 'Flutter', category: 'mobile-development', popularityScore: 75 },
    { name: 'React Native', category: 'mobile-development', popularityScore: 80 },
    { name: 'MongoDB', category: 'web-development', popularityScore: 83 },
    { name: 'PostgreSQL', category: 'web-development', popularityScore: 81 },
    { name: 'Express.js', category: 'web-development', popularityScore: 86 },
    { name: 'Next.js', category: 'web-development', popularityScore: 84 },
    { name: 'Vue.js', category: 'web-development', popularityScore: 76 },
    { name: 'Angular', category: 'web-development', popularityScore: 74 },
    { name: 'Django', category: 'web-development', popularityScore: 79 },
    { name: 'Flask', category: 'web-development', popularityScore: 72 },
    { name: 'Spring Boot', category: 'web-development', popularityScore: 77 },
    { name: 'Docker', category: 'other', popularityScore: 87 },
    { name: 'Kubernetes', category: 'other', popularityScore: 82 },
    { name: 'AWS', category: 'other', popularityScore: 89 },
    { name: 'Git', category: 'other', popularityScore: 94 },
    { name: 'GraphQL', category: 'web-development', popularityScore: 73 },
];

const seedSkills = async () => {
    try {
        await connectDB();

        // Clear existing skills
        await Skill.deleteMany({});
        console.log('🗑️  Cleared existing skills');

        // Insert new skills
        await Skill.insertMany(skills);
        console.log(`✅ Seeded ${skills.length} skills`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding skills:', error);
        process.exit(1);
    }
};

seedSkills();
